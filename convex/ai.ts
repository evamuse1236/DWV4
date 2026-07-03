import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { requireMaintenanceKey } from "./authz";

// ============================================================================
// Types
// ============================================================================

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

async function requireActionSession(ctx: ActionCtx, token: string) {
  const user = await ctx.runQuery(api.auth.getCurrentUser, { token });
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

async function requireActionAdmin(ctx: ActionCtx, adminToken: string) {
  const user = await requireActionSession(ctx, adminToken);
  if (user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user;
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
// Project Data Entry Prompt
// ============================================================================

function buildProjectDataPrompt(
  projectName: string,
  students: Array<{ id: string; name: string; batch?: string }>
): string {
  const studentList = students
    .map((s) => `- ${s.name}${s.batch ? ` (Batch ${s.batch})` : ""} [id: ${s.id}]`)
    .join("\n");

  return `You are an admin operations assistant for "${projectName}".

AVAILABLE STUDENTS:
${studentList}

YOUR TASK:
1. Understand the admin's natural-language request.
2. If it's about student project reports, extract structured project updates.
3. If it's about adding a book, extract structured book details (especially Google Drive reading links).
4. Keep your conversational response short and actionable.

CONVERSATION STYLE:
- Fast, clear, and coach-friendly.
- Confirm what you captured.
- Ask a clarification question only when required fields are missing.

LINK TYPE DETECTION:
- URLs containing "presentation", "slides", "ppt" → "presentation"
- URLs containing "doc", "pdf", "sheet" → "document"
- URLs containing "video", "youtube", "loom" → "video"
- Otherwise → "other"

BOOK EXTRACTION RULES:
- Prefer Google Drive URLs in "readingUrl" when present.
- Keep required fields for add-book as title + author.
- Optional fields: genre, gradeLevel, description, coverImageUrl, pageCount.

INTENT HINTS:
- If the user text includes [INTENT:add_project_data], prioritize extracting project updates.
- If the user text includes [INTENT:add_book], prioritize extracting add-book details.
- You may return both in one response when both are present.`;
}

function buildProjectDataFormatterPrompt(
  creativeResponse: string,
  projectName: string,
  students: Array<{ id: string; name: string; batch?: string }>
): string {
  const studentList = students
    .map((s) => `- ${s.name}${s.batch ? ` (Batch ${s.batch})` : ""} [id: ${s.id}]`)
    .join("\n");

  return `Convert the assistant response into structured executable commands for the admin panel.

PROJECT:
${projectName}

AVAILABLE STUDENTS:
${studentList}

ASSISTANT RESPONSE TO CONVERT:
${creativeResponse}

OUTPUT EXACTLY THIS FORMAT (start with \`\`\`admin-commands, end with \`\`\`):
\`\`\`admin-commands
{
  "assistantText": "Short user-facing response (1-2 lines)",
  "summary": "Brief summary of what will be saved",
  "commands": [
    {
      "type": "add_project_data",
      "studentName": "Matched student name",
      "studentId": "student_id_from_available_students",
      "links": [
        { "url": "https://...", "title": "Link title", "type": "presentation|document|video|other" }
      ],
      "reflections": {
        "didWell": "string or null",
        "projectDescription": "string or null",
        "couldImprove": "string or null"
      }
    },
    {
      "type": "add_book",
      "book": {
        "title": "Book title",
        "author": "Author name",
        "readingUrl": "https://... or null",
        "coverImageUrl": "https://... or null",
        "description": "string or null",
        "gradeLevel": "string or null",
        "genre": "string or null",
        "pageCount": 123
      }
    }
  ]
}
\`\`\`

RULES:
- Start with EXACTLY \`\`\`admin-commands (not \`\`\`json)
- Output ONLY the code block, no prose outside it
- Use only valid student IDs from AVAILABLE STUDENTS
- If a student name is ambiguous, exclude that command and explain in assistantText
- For project data, allow partial reflections; use null for missing fields
- For add_book, require title + author; skip command if either is missing
- For pageCount, return a number only when confident; otherwise omit the field
- If nothing actionable is found, return "commands": [] with a clear assistantText`;
}

// ============================================================================
// Exported Actions
// ============================================================================

export const projectDataChat = action({
  args: {
    adminToken: v.string(),
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
  handler: async (ctx, args) => {
    await requireActionAdmin(ctx, args.adminToken);
    const systemPrompt = buildProjectDataPrompt(args.projectName, args.students);

    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...args.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const creativeResult = await callAIWithFallback(
      apiMessages,
      0.5,
      "ProjectData:creative"
    );

    try {
      const formatterPrompt = buildProjectDataFormatterPrompt(
        creativeResult.content,
        args.projectName,
        args.students
      );
      const formattedResult = await callGroqWithRetry(
        GROQ_FORMATTER_MODEL,
        [{ role: "user", content: formatterPrompt }],
        0.1,
        "ProjectData:formatter"
      );

      return {
        content: formattedResult.content,
        usage: {
          creative: creativeResult.usage,
          formatter: formattedResult.usage,
        },
        provider: `${creativeResult.provider}+groq-formatter`,
      };
    } catch (error) {
      console.warn(
        `[ProjectData] Formatter failed, falling back to creative response: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return creativeResult;
    }
  },
});

/**
 * Test chat action - accepts a custom system prompt for testing new prompt designs.
 * Use this to iterate on prompts before updating the production versions.
 */
export const testChat = action({
  args: {
    maintenanceKey: v.optional(v.string()),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    systemPrompt: v.string(),
    temperature: v.optional(v.number()),
    model: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    requireMaintenanceKey(args.maintenanceKey);
    const apiMessages: ChatMessage[] = [
      { role: "system", content: args.systemPrompt },
      ...args.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const temperature = args.temperature ?? 0.7;
    const model = args.model ?? GROQ_PRIMARY_MODEL;

    // Use direct Groq call with specified model
    return callGroqWithRetry(model, apiMessages, temperature, "TestChat");
  },
});
