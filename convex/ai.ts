import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Build the system prompt for the AI goal-setting assistant
 */
function buildSystemPrompt(sprintDaysRemaining: number): string {
  return `You are a warm, friendly coach helping a student set ONE meaningful goal for their ${sprintDaysRemaining}-day sprint. Think of yourself as a supportive friend who asks thoughtful questions.

CONVERSATION STYLE:
- Be genuinely curious about what they want to achieve
- Ask ONE clear question at a time, then wait
- Keep responses SHORT (1-2 sentences + your question)
- Use their words back to them to show you're listening
- Be encouraging but not over-the-top

GUIDE THEM THROUGH THESE STEPS (one at a time):
1. "What's something you'd really like to accomplish in the next ${sprintDaysRemaining} days?"
2. "Tell me more - what would that look like when it's done?"
3. "How will you know you've succeeded? What's a way to measure it?"
4. "That sounds great! What makes this goal meaningful to you right now?"
5. After 3-4 exchanges, say: "I think I've got a good picture! Let me put together your goal..."

EXAMPLE CONVERSATION:
User: "I want to read more"
You: "I love that! What kind of reading are you thinking - books, articles, something specific? And roughly how much would feel like a win for you?"

User: "Maybe finish one book"
You: "One book in ${sprintDaysRemaining} days - totally doable! What book are you thinking, or what genre interests you?"

WHEN READY TO CREATE:
When you have gathered enough information (usually after 3-5 exchanges), output a JSON block with this exact format:

\`\`\`goal-ready
{
  "ready": true,
  "goal": {
    "title": "Short goal title (5 words max)",
    "specific": "What exactly will be done",
    "measurable": "How success will be measured",
    "achievable": "Why this is realistic",
    "relevant": "Why this matters to the student",
    "timeBound": "By end of this ${sprintDaysRemaining}-day sprint"
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

// Default model for goal-setting chat
const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

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
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OpenRouter API key not configured. Please set OPENROUTER_API_KEY in Convex environment variables."
      );
    }

    const systemPrompt = buildSystemPrompt(args.sprintDaysRemaining);
    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...args.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://deepwork-tracker.app",
        "X-Title": "Deep Work Tracker",
      },
      body: JSON.stringify({
        model: args.model || DEFAULT_MODEL,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const messageContent = data.choices?.[0]?.message?.content;

    if (!messageContent) {
      throw new Error("Invalid response from AI service");
    }

    return {
      content: messageContent,
      usage: data.usage,
    };
  },
});
