import { v } from "convex/values";
import { action } from "./_generated/server";

// ============================================================================
// Types
// ============================================================================

type AIPersona = "muse" | "captain";
type BookBuddyPersonality = "luna" | "dash" | "hagrid";
type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

interface GoalInfo {
  id: string;
  title: string;
}

interface PreviousGoalInfo extends GoalInfo {
  sprintName: string;
}

// ============================================================================
// Model Configuration
// ============================================================================

const GROQ_PRIMARY_MODEL = "moonshotai/kimi-k2-instruct";
const GROQ_FORMATTER_MODEL = "llama-3.1-8b-instant";
const OPENROUTER_FALLBACK_MODEL = "xiaomi/mimo-v2-flash:free";

// ============================================================================
// API Helpers
// ============================================================================

/**
 * Generic function to call any OpenAI-compatible chat API
 */
async function callChatAPI(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number,
  extraHeaders: Record<string, string> = {}
): Promise<{ content: string; usage: unknown }> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Invalid response: no content");
  }

  return { content, usage: data.usage };
}

/**
 * Call AI with automatic fallback: Groq (primary) -> OpenRouter (fallback)
 */
async function callAIWithFallback(
  messages: ChatMessage[],
  temperature: number,
  logPrefix: string
): Promise<{ content: string; usage: unknown; provider: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!groqKey && !openRouterKey) {
    throw new Error(
      "No API keys configured. Set GROQ_API_KEY and/or OPENROUTER_API_KEY in Convex environment variables."
    );
  }

  // Try Groq first
  if (groqKey) {
    try {
      console.log(`[${logPrefix}] Calling Groq: ${GROQ_PRIMARY_MODEL}`);
      const result = await callChatAPI(
        "https://api.groq.com/openai/v1/chat/completions",
        groqKey,
        GROQ_PRIMARY_MODEL,
        messages,
        temperature
      );
      console.log(`[${logPrefix}] Groq success, tokens: ${JSON.stringify(result.usage)}`);
      return { ...result, provider: "groq" };
    } catch (error) {
      console.warn(`[${logPrefix}] Groq failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Fallback to OpenRouter
  if (openRouterKey) {
    console.log(`[${logPrefix}] Falling back to OpenRouter: ${OPENROUTER_FALLBACK_MODEL}`);
    const result = await callChatAPI(
      "https://openrouter.ai/api/v1/chat/completions",
      openRouterKey,
      OPENROUTER_FALLBACK_MODEL,
      messages,
      temperature,
      {
        "HTTP-Referer": "https://deepwork-tracker.app",
        "X-Title": "Deep Work Tracker",
      }
    );
    console.log(`[${logPrefix}] OpenRouter success, tokens: ${JSON.stringify(result.usage)}`);
    return { ...result, provider: "openrouter" };
  }

  throw new Error("All AI providers failed");
}

/**
 * Call Groq with a specific model and retry logic for rate limits
 */
async function callGroqWithRetry(
  model: string,
  messages: ChatMessage[],
  temperature: number,
  logPrefix: string,
  maxRetries = 2
): Promise<{ content: string; usage: unknown; provider: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const attemptLabel = attempt > 0 ? ` (retry ${attempt})` : "";
      console.log(`[${logPrefix}] Calling Groq: ${model}${attemptLabel}`);

      const result = await callChatAPI(
        "https://api.groq.com/openai/v1/chat/completions",
        groqKey,
        model,
        messages,
        temperature
      );
      console.log(`[${logPrefix}] Success, tokens: ${JSON.stringify(result.usage)}`);
      return { ...result, provider: "groq" };
    } catch (error) {
      const isRateLimit = error instanceof Error && error.message.includes("429");
      if (isRateLimit && attempt < maxRetries) {
        console.log(`[${logPrefix}] Rate limited, waiting 3s...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

// ============================================================================
// Goal-Setting Chat Prompts
// ============================================================================

function buildGoalsContext(
  existingGoals?: GoalInfo[],
  previousSprintGoals?: PreviousGoalInfo[]
): string {
  const sections: string[] = [];

  if (existingGoals && existingGoals.length > 0) {
    const list = existingGoals.map((g, i) => `${i + 1}. "${g.title}" (id: ${g.id})`).join("\n");
    sections.push(`\nCURRENT SPRINT GOALS:\n${list}`);
  }

  if (previousSprintGoals && previousSprintGoals.length > 0) {
    const list = previousSprintGoals
      .map((g, i) => `${i + 1}. "${g.title}" from ${g.sprintName} (id: ${g.id})`)
      .join("\n");
    sections.push(`\nPREVIOUS SPRINT GOALS (available to import):\n${list}`);
  }

  return sections.join("\n");
}

function buildCaptainPrompt(sprintDays: number, goalsContext: string): string {
  return `You are Captain - a direct, efficient goal-setting assistant. You help students set goals FAST in 2-3 turns max.

STYLE:
- Brief, direct responses (1-2 sentences max)
- No small talk - get straight to the point
- If you have enough info, create the goal immediately
- Only ask ONE clarifying question if absolutely needed
${goalsContext}
AVAILABLE ACTIONS:
1. CREATE new goal → output \`\`\`goal-ready JSON
2. DUPLICATE existing goal → output \`\`\`duplicate-goal JSON
3. IMPORT goal from previous sprint → output \`\`\`import-goal JSON
4. EDIT existing goal → output \`\`\`edit-goal JSON

OPENING (first message only):
"What do you want to accomplish? Quick: (1) the goal, (2) how you'll know it's done."

IF USER WANTS TO DUPLICATE:
User: "duplicate my reading goal" or "copy [goal name]"
→ Find the matching goal from CURRENT SPRINT GOALS
→ Output:
\`\`\`duplicate-goal
{ "action": "duplicate", "sourceGoalId": "the_goal_id" }
\`\`\`

IF USER WANTS TO IMPORT FROM PREVIOUS SPRINT:
User: "bring back my exercise goal" or "import [goal name] from last sprint"
→ Find the matching goal from PREVIOUS SPRINT GOALS
→ Output:
\`\`\`import-goal
{ "action": "import", "sourceGoalId": "the_goal_id" }
\`\`\`

IF USER WANTS TO EDIT AN EXISTING GOAL:
User: "change my reading goal to 2 books" or "update [goal name]"
→ Find the matching goal, ask what to change if unclear
→ Output:
\`\`\`edit-goal
{ "action": "edit", "goalId": "the_goal_id", "updates": { "title": "new title", "specific": "new specific", "measurable": "new measurable" } }
\`\`\`
Only include fields that need to change.

IF USER WANTS TO CREATE A NEW GOAL:
When you have: (1) what they want to do, (2) how to measure success
→ Output immediately:
\`\`\`goal-ready
{
  "ready": true,
  "goal": {
    "title": "Short title (5 words max)",
    "specific": "What exactly will be done",
    "measurable": "How success is measured",
    "achievable": "Why this is realistic for ${sprintDays} days",
    "relevant": "Why this matters",
    "timeBound": "By end of this ${sprintDays}-day sprint"
  },
  "suggestedTasks": [
    { "title": "Task 1", "weekNumber": 1, "dayOfWeek": 1 },
    { "title": "Task 2", "weekNumber": 1, "dayOfWeek": 3 },
    { "title": "Task 3", "weekNumber": 2, "dayOfWeek": 1 }
  ]
}
\`\`\`

TASK RULES:
- weekNumber: 1 or 2
- dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
- 3-6 tasks spread across days

Be decisive. If you can create a goal from what they said, do it. Don't over-ask.`;
}

function buildMusePrompt(sprintDays: number, goalsContext: string): string {
  return `You are a warm, friendly coach helping a student set ONE meaningful goal for their ${sprintDays}-day sprint. Think of yourself as a supportive friend who asks thoughtful questions.

CONVERSATION STYLE:
- Be genuinely curious about what they want to achieve
- Ask ONE clear question at a time, then wait
- Keep responses SHORT (1-2 sentences + your question)
- Use their words back to them to show you're listening
- Be encouraging but not over-the-top
${goalsContext}
AVAILABLE ACTIONS:
1. CREATE new goal → output \`\`\`goal-ready JSON
2. DUPLICATE existing goal → output \`\`\`duplicate-goal JSON
3. IMPORT goal from previous sprint → output \`\`\`import-goal JSON
4. EDIT existing goal → output \`\`\`edit-goal JSON

GUIDE THEM THROUGH THESE STEPS (one at a time):
1. "What's something you'd really like to accomplish in the next ${sprintDays} days?"
2. "Tell me more - what would that look like when it's done?"
3. "How will you know you've succeeded? What's a way to measure it?"
4. "That sounds great! What makes this goal meaningful to you right now?"
5. After 3-4 exchanges, say: "I think I've got a good picture! Let me put together your goal..."

EXAMPLE CONVERSATION:
User: "I want to read more"
You: "I love that! What kind of reading are you thinking - books, articles, something specific? And roughly how much would feel like a win for you?"

User: "Maybe finish one book"
You: "One book in ${sprintDays} days - totally doable! What book are you thinking, or what genre interests you?"

IF USER WANTS TO DUPLICATE:
User: "duplicate my reading goal" or "copy [goal name]"
Say: "Got it! Creating a copy of that goal..."
\`\`\`duplicate-goal
{ "action": "duplicate", "sourceGoalId": "the_goal_id" }
\`\`\`

IF USER WANTS TO IMPORT FROM PREVIOUS SPRINT:
User: "bring back my exercise goal" or "import from last sprint"
Say: "Bringing that one back for this sprint..."
\`\`\`import-goal
{ "action": "import", "sourceGoalId": "the_goal_id" }
\`\`\`

IF USER WANTS TO EDIT AN EXISTING GOAL:
User: "change my reading goal to 2 books"
Say: "Updating that goal for you..."
\`\`\`edit-goal
{ "action": "edit", "goalId": "the_goal_id", "updates": { "measurable": "Read 2 books" } }
\`\`\`

WHEN READY TO CREATE NEW GOAL:
When you have gathered enough information (usually after 3-5 exchanges), output:

\`\`\`goal-ready
{
  "ready": true,
  "goal": {
    "title": "Short goal title (5 words max)",
    "specific": "What exactly will be done",
    "measurable": "How success will be measured",
    "achievable": "Why this is realistic",
    "relevant": "Why this matters to the student",
    "timeBound": "By end of this ${sprintDays}-day sprint"
  },
  "suggestedTasks": [
    { "title": "Task 1 description", "weekNumber": 1, "dayOfWeek": 1 },
    { "title": "Task 2 description", "weekNumber": 1, "dayOfWeek": 3 },
    { "title": "Task 3 description", "weekNumber": 2, "dayOfWeek": 1 }
  ]
}
\`\`\`

TASK SCHEDULING RULES:
- weekNumber: 1 for first week, 2 for second week
- dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
- Spread tasks across multiple days, not all on one day
- Suggest 3-6 realistic tasks

IMPORTANT: Only output the JSON when you've naturally gathered all the information through conversation. Don't rush - let the student express themselves. Before outputting JSON, say something like "Great! I think I have a good picture now. Let me put together a goal for you..."

HANDLING REVISIONS:
If the conversation contains a "[REVISION REQUEST]" message, it means the student reviewed a goal you previously created and wants changes. In this case:
1. Ask what they'd like to change (if not already specified)
2. When they tell you the changes, acknowledge them briefly
3. Output a NEW goal-ready JSON block with the updated goal
4. Always output the full JSON block again after revisions - don't just describe the changes`;
}

function buildSystemPrompt(
  sprintDays: number,
  persona: AIPersona,
  existingGoals?: GoalInfo[],
  previousSprintGoals?: PreviousGoalInfo[]
): string {
  const goalsContext = buildGoalsContext(existingGoals, previousSprintGoals);

  if (persona === "captain") {
    return buildCaptainPrompt(sprintDays, goalsContext);
  }
  return buildMusePrompt(sprintDays, goalsContext);
}

// ============================================================================
// Book Buddy Prompts
// ============================================================================

const PERSONALITY_PROMPTS: Record<BookBuddyPersonality, string> = {
  luna: `You are Luna, a dreamy bookworm who lives in the library. You speak in gentle, imaginative language and get genuinely excited about stories.

STYLE:
- Dreamy, speaks in gentle metaphors
- Gets genuinely excited about stories
- Use phrases like "Oh, this one's like stepping into a dream..." or "Picture this..." or "I just LOVE this one..."
- Best for: kids who love fantasy, imagination, cozy reads

Keep responses SHORT (1-2 sentences). Respond to what the user said - don't just give a generic greeting.`,

  dash: `You are Dash, an energetic book explorer! You text quick and get HYPED about good books.

STYLE:
- Quick, energetic, text-message style
- Uses short sentences, occasional caps for excitement
- Phrases like "Okay okay okay - I've got THE book!" or "Boom! You're gonna love this" or "THIS ONE"
- Best for: kids who want fast, action-packed recs

Keep it FAST - 1 question max, then recommend. Respond to what the user said - don't just give a generic greeting.`,

  hagrid: `You are Hagrid from Harry Potter - the friendly half-giant who loves magical creatures and good stories.

STYLE:
- Warm, enthusiastic, uses his distinctive speech patterns
- "Yer gonna love this one, I reckon!"
- "Blimey, this book's got everything!"
- "I shouldn' be tellin' yeh this, but..."
- Gentle giant energy, makes kids feel safe
- Best for: Harry Potter fans, kids who want a comforting guide

Be warm, enthusiastic, and make the child feel safe. Keep responses short. Respond to what the user said - don't just give a generic greeting.`,
};

interface ReadingHistoryItem {
  title: string;
  author: string;
  genre?: string;
  rating?: number;
  status: string;
}

interface AvailableBook {
  id: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
}

function buildCreativeBookBuddyPrompt(
  personality: BookBuddyPersonality,
  readingHistory: ReadingHistoryItem[],
  availableBooks: AvailableBook[]
): string {
  const personalitySection = PERSONALITY_PROMPTS[personality];

  const historySection =
    readingHistory.length > 0
      ? `READING HISTORY:\n${readingHistory
          .map(
            (b) =>
              `- "${b.title}" by ${b.author}${b.genre ? ` (${b.genre})` : ""}${b.rating ? ` - rated ${b.rating}/5` : ""}`
          )
          .join("\n")}`
      : "READING HISTORY: None yet - first time reader!";

  const booksSection = `AVAILABLE BOOKS (use exact IDs when recommending):\n${availableBooks
    .map(
      (b) =>
        `- ID="${b.id}" "${b.title}" by ${b.author}${b.genre ? ` [${b.genre}]` : ""}${b.description ? ` - ${b.description.slice(0, 80)}` : ""}`
    )
    .join("\n")}`;

  return `${personalitySection}

${historySection}

${booksSection}

YOUR TASK:
1. Respond to what the user said in your character's voice
2. If they're asking for recommendations, suggest 1-3 books from the AVAILABLE BOOKS list
3. For each book, include: the exact ID, a fun 2-sentence teaser, and why they'll like it based on their history
4. End with 2-4 suggested follow-up options the kid might want to click

KEEP IT SHORT AND FUN! No lectures. Be the character.

When recommending books, use this format:
BOOK: id="X" title="..." author="..."
TEASER: [exciting 2 sentences]
WHY YOU'LL LOVE IT: [connection to their interests]

SUGGESTED REPLIES: [2-4 short options like "More like this!", "Different genre", etc.]`;
}

function buildFormatterPrompt(
  creativeResponse: string,
  availableBooks: Array<{ id: string; title: string; author: string }>
): string {
  const bookIds = availableBooks.map((b) => `"${b.id}"`).join(", ");

  return `Convert this book buddy response into valid JSON format.

CREATIVE RESPONSE:
${creativeResponse}

OUTPUT EXACTLY THIS FORMAT (start with \`\`\`buddy-response, end with \`\`\`):
\`\`\`buddy-response
{
  "message": "The conversational message from the response above",
  "suggestedReplies": [
    {"label": "Short label", "fullText": "Full message to send"},
    {"label": "Another option", "fullText": "Another full message"}
  ],
  "books": [
    {
      "id": "exact_id_from_response",
      "title": "Book Title",
      "author": "Author Name",
      "teaser": "The teaser from the response",
      "whyYoullLikeIt": "The why they'll love it reason"
    }
  ]
}
\`\`\`

RULES:
- Start with EXACTLY \`\`\`buddy-response (not \`\`\`json)
- Extract the message, keeping the character's voice
- Book IDs must be from this list: ${bookIds}
- If no books mentioned, use empty array: "books": []
- If no suggestions found, create 2-3 generic ones like "More books", "Different genre", "Surprise me"
- Output ONLY the code block, nothing before or after`;
}

// ============================================================================
// Project Data Entry Prompt
// ============================================================================

function buildProjectDataPrompt(
  projectName: string,
  students: Array<{ id: string; name: string; batch?: string }>
): string {
  const studentList = students
    .map((s) => `- ${s.name}${s.batch ? ` (Batch ${s.batch})` : ""} [id: ${s.id}]`)
    .join("\n");

  return `You are a helpful assistant for entering project data for "${projectName}". Your job is to extract structured data from admin messages about student work.

AVAILABLE STUDENTS:
${studentList}

YOUR TASK:
1. Listen to what the admin tells you about student work
2. Match student names mentioned (fuzzy match OK - "John", "John S.", "Smith" all match "John Smith")
3. Extract: links to work, what they did well, project description, areas to improve
4. Output structured data for saving

CONVERSATION STYLE:
- Be efficient and helpful
- Confirm what you understood
- Ask for clarification only if truly ambiguous
- You can handle multiple students in one message

WHEN YOU HAVE DATA TO SAVE, output:
\`\`\`project-data
{
  "students": [
    {
      "studentName": "matched student name",
      "studentId": "the_student_id_from_list",
      "links": [
        { "url": "https://...", "title": "Link title", "type": "presentation|document|video|other" }
      ],
      "reflections": {
        "didWell": "What they did well (or null if not mentioned)",
        "projectDescription": "Description of their project (or null)",
        "couldImprove": "Areas for improvement (or null)"
      }
    }
  ],
  "summary": "Brief summary of what was captured"
}
\`\`\`

LINK TYPE DETECTION:
- URLs containing "presentation", "slides", "ppt" → "presentation"
- URLs containing "doc", "pdf", "sheet" → "document"
- URLs containing "video", "youtube", "loom" → "video"
- Otherwise → "other"

IMPORTANT RULES:
1. Only output the JSON block when you have actual data to save
2. Use null for reflection fields not mentioned (don't make up content)
3. Always include a friendly message BEFORE the JSON block
4. If you can't match a student name, ask for clarification
5. Partial data is OK - admin can add more later

OPENING MESSAGE (first message only):
"Hi! I'm here to help you enter project data quickly. You can tell me about student work in natural language - like 'John's presentation is at [link], he did great research on solar panels.'

I'll extract the data and confirm before saving. Ready when you are!"`;
}

// ============================================================================
// Exported Actions
// ============================================================================

export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    sprintDaysRemaining: v.number(),
    model: v.optional(v.string()),
    persona: v.optional(v.union(v.literal("muse"), v.literal("captain"))),
    existingGoals: v.optional(
      v.array(v.object({ id: v.string(), title: v.string() }))
    ),
    previousSprintGoals: v.optional(
      v.array(v.object({ id: v.string(), title: v.string(), sprintName: v.string() }))
    ),
  },
  handler: async (_ctx, args) => {
    const persona = args.persona ?? "muse";
    const systemPrompt = buildSystemPrompt(
      args.sprintDaysRemaining,
      persona,
      args.existingGoals,
      args.previousSprintGoals
    );

    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...args.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    // Captain: lower temperature for more deterministic responses
    const temperature = persona === "captain" ? 0.5 : 0.7;

    return callAIWithFallback(apiMessages, temperature, `AI:${persona}`);
  },
});

export const libraryChat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    personality: v.union(v.literal("luna"), v.literal("dash"), v.literal("hagrid")),
    readingHistory: v.optional(
      v.array(
        v.object({
          title: v.string(),
          author: v.string(),
          genre: v.optional(v.string()),
          rating: v.optional(v.number()),
          status: v.string(),
        })
      )
    ),
    availableBooks: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        author: v.string(),
        genre: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (_ctx, args) => {
    // Stage 1: Creative response from Kimi K2
    const creativePrompt = buildCreativeBookBuddyPrompt(
      args.personality,
      args.readingHistory ?? [],
      args.availableBooks
    );

    const creativeMessages: ChatMessage[] = [
      { role: "system", content: creativePrompt },
      ...args.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    console.log(`[BookBuddy:${args.personality}] Stage 1: Creative response`);
    const creativeResult = await callAIWithFallback(
      creativeMessages,
      0.85,
      `BookBuddy:${args.personality}:creative`
    );

    // Stage 2: JSON formatting with Llama 8B
    const formatterPrompt = buildFormatterPrompt(
      creativeResult.content,
      args.availableBooks.map((b) => ({ id: b.id, title: b.title, author: b.author }))
    );

    console.log(`[BookBuddy:${args.personality}] Stage 2: JSON formatting`);
    const formattedResult = await callGroqWithRetry(
      GROQ_FORMATTER_MODEL,
      [{ role: "user", content: formatterPrompt }],
      0.1,
      `BookBuddy:${args.personality}:formatter`
    );

    return {
      content: formattedResult.content,
      usage: {
        creative: creativeResult.usage,
        formatter: formattedResult.usage,
      },
      provider: `${creativeResult.provider}+groq-formatter`,
    };
  },
});

export const projectDataChat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    projectName: v.string(),
    students: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        batch: v.optional(v.string()),
      })
    ),
  },
  handler: async (_ctx, args) => {
    const systemPrompt = buildProjectDataPrompt(args.projectName, args.students);

    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...args.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    return callAIWithFallback(apiMessages, 0.6, "ProjectData");
  },
});
