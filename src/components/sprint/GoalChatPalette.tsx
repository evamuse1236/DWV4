import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ExtractedGoal {
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

interface SuggestedTask {
  title: string;
  weekNumber: number;
  dayOfWeek: number;
}

interface GoalChatPaletteProps {
  sprintDaysRemaining: number;
  onComplete: (goal: ExtractedGoal, tasks: SuggestedTask[]) => void;
  onCancel: () => void;
}

type ChatPhase = "chatting" | "reviewing" | "scheduling";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper to create a message object with a unique ID
function createMessage(role: "user" | "assistant", content: string): Message {
  return {
    id: `${role}-${Date.now()}`,
    role,
    content,
  };
}

// Animated typing indicator shown while AI is responding
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start"
    >
      <div className="bg-white border border-black/10 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1, delay }}
              className="w-2 h-2 bg-black/40 rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Get header title based on current phase
function getPhaseTitle(phase: ChatPhase): string {
  switch (phase) {
    case "chatting":
      return "Let's set your goal";
    case "reviewing":
      return "Review your goal";
    case "scheduling":
      return "Your tasks";
  }
}

// Shared button style for transparent "ghost" buttons
const GHOST_BUTTON_STYLE =
  "bg-transparent border-none text-[14px] opacity-50 text-[#1a1a1a] cursor-pointer hover:opacity-100 transition-opacity";

// Available AI models
const AI_MODELS = [
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3", description: "Fast & capable" },
  { id: "xiaomi/mimo-v2-flash:free", name: "MiMo Flash", description: "Quick responses" },
  { id: "tngtech/deepseek-r1t2-chimera:free", name: "DeepSeek", description: "Deep reasoning" },
];

/**
 * AI-powered goal setting chat palette
 * Guides students through creating SMART goals via conversation
 */
export function GoalChatPalette({
  sprintDaysRemaining,
  onComplete,
  onCancel,
}: GoalChatPaletteProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<ChatPhase>("chatting");
  const [extractedGoal, setExtractedGoal] = useState<ExtractedGoal | null>(null);
  const [tasks, setTasks] = useState<SuggestedTask[]>([]);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [pendingRevision, setPendingRevision] = useState<ExtractedGoal | null>(null);

  const chatAction = useAction(api.ai.chat);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const greeting: Message = {
      id: "initial",
      role: "assistant",
      content: `Hi there! 👋 I'm here to help you set a goal for this sprint. What would you like to accomplish in the next ${sprintDaysRemaining} days?`,
    };
    setMessages([greeting]);
  }, [sprintDaysRemaining]);

  // Focus input when phase changes to chatting
  useEffect(() => {
    if (phase === "chatting") {
      inputRef.current?.focus();
    }
  }, [phase]);

  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage = createMessage("user", trimmedInput);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // Convert to API format (exclude initial greeting for cleaner context)
      let apiMessages = messages
        .filter((m) => m.id !== "initial")
        .concat(userMessage)
        .map((m) => ({ role: m.role, content: m.content }));

      // If we're in revision mode, inject context about the previous goal
      if (pendingRevision) {
        const revisionContext = {
          role: "user" as const,
          content: `[REVISION REQUEST] I reviewed the goal "${pendingRevision.title}" and want to make changes. Here's what I had: Specific: ${pendingRevision.specific}, Measurable: ${pendingRevision.measurable}`,
        };
        // Insert revision context before the last user message
        apiMessages = [
          ...apiMessages.slice(0, -1),
          revisionContext,
          apiMessages[apiMessages.length - 1],
        ];
        setPendingRevision(null); // Clear after using
      }

      const response = await chatAction({
        messages: apiMessages,
        sprintDaysRemaining,
        model: selectedModel,
      });

      // Check if AI returned structured goal data
      const goalMatch = response.content.match(/```goal-ready\n([\s\S]*?)\n```/);

      if (goalMatch) {
        const parsed = parseGoalData(goalMatch[1]);
        if (parsed) {
          setExtractedGoal(parsed.goal);
          setTasks(parsed.tasks);
          setPhase("reviewing");

          // Add a friendly message (text before the JSON block)
          const textBeforeJson = response.content.split("```goal-ready")[0].trim();
          const content = textBeforeJson || "Great! I've put together a goal based on our conversation. Take a look!";
          setMessages((prev) => [...prev, createMessage("assistant", content)]);
          return;
        }
      }

      // Regular chat response (or JSON parse failed)
      setMessages((prev) => [...prev, createMessage("assistant", response.content)]);
    } catch (err) {
      console.error("Chat error:", err);
      setError("Oops! Something went wrong. Try again or create your goal manually.");
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", "I had trouble responding. Could you try saying that again?"),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse goal JSON from AI response, returns null on failure
  function parseGoalData(jsonString: string): { goal: ExtractedGoal; tasks: SuggestedTask[] } | null {
    try {
      const data = JSON.parse(jsonString);
      return {
        goal: data.goal,
        tasks: data.suggestedTasks || [],
      };
    } catch {
      return null;
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGoBack = () => {
    // Store the goal for revision context, and show a friendly AI prompt
    if (extractedGoal) {
      setPendingRevision(extractedGoal);
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", "No problem! What would you like to change about this goal?"),
      ]);
    }

    setPhase("chatting");
    setExtractedGoal(null);
    setTasks([]);
  };

  const handleConfirmGoal = () => {
    setPhase("scheduling");
  };

  const handleToggleTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (extractedGoal) {
      onComplete(extractedGoal, tasks);
    }
  };

  // Render chat phase
  const renderChatPhase = () => (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-[#1a1a1a] text-white rounded-br-md"
                    : "bg-white border border-black/10 rounded-bl-md"
                }`}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-black/10 p-4 bg-white/50">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-black/10 rounded-xl focus:outline-none focus:border-black/30 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-[#1a1a1a] text-white rounded-xl disabled:opacity-40 transition-opacity"
          >
            Send
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  );

  // Render review phase
  const renderReviewPhase = () => (
    <div className="p-8 overflow-y-auto">
      <div className="text-center mb-8">
        <span className="text-[0.7rem] uppercase tracking-[0.2em] text-[#888] block mb-2">
          Your Goal
        </span>
        <h2 className="font-display italic text-[1.8rem]">{extractedGoal?.title}</h2>
      </div>

      {/* SMART components */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 mb-6">
        <div>
          <label className="text-[10px] uppercase tracking-wide text-black/50 font-bold">Specific</label>
          <p className="text-[15px] mt-1">{extractedGoal?.specific}</p>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-black/50 font-bold">Measurable</label>
          <p className="text-[15px] mt-1">{extractedGoal?.measurable}</p>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-black/50 font-bold">Achievable</label>
          <p className="text-[15px] mt-1">{extractedGoal?.achievable}</p>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-black/50 font-bold">Relevant</label>
          <p className="text-[15px] mt-1">{extractedGoal?.relevant}</p>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-black/50 font-bold">Time-bound</label>
          <p className="text-[15px] mt-1">{extractedGoal?.timeBound}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-6">
        <button onClick={handleGoBack} className={GHOST_BUTTON_STYLE}>
          &larr; EDIT MORE
        </button>
        <button
          onClick={handleConfirmGoal}
          className="btn btn-primary"
          style={{ padding: "16px 48px" }}
        >
          LOOKS GOOD →
        </button>
      </div>
    </div>
  );

  // Render scheduling phase
  const renderSchedulingPhase = () => (
    <div className="p-8 overflow-y-auto">
      <div className="text-center mb-8">
        <span className="text-[0.7rem] uppercase tracking-[0.2em] text-[#888] block mb-2">
          Suggested Tasks
        </span>
        <h2 className="font-display italic text-[1.5rem]">Review your action items</h2>
      </div>

      {/* Task list */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-black/5 rounded-xl group"
              >
                <div className="w-6 h-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-xs">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="text-[15px]">{task.title}</p>
                  <p className="text-[11px] text-black/50 mt-0.5">
                    Week {task.weekNumber} • {DAYS_OF_WEEK[task.dayOfWeek]}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleTask(index)}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-red-500 transition-opacity"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-black/50 py-4">
            No tasks added. You can add them later!
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="text-center mb-6">
        <p className="text-sm text-black/50">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} will be created
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-6">
        <button onClick={() => setPhase("reviewing")} className={GHOST_BUTTON_STYLE}>
          &larr; BACK
        </button>
        <button
          onClick={handleComplete}
          className="btn btn-primary"
          style={{ padding: "16px 48px" }}
        >
          CREATE GOAL
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="journal-overlay active"
      style={{ background: "rgba(232, 245, 233, 0.97)" }}
    >
      <div className="w-full max-w-[600px] h-[80vh] max-h-[700px] flex flex-col bg-[#faf9f6] rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-white">
          <div>
            <span className="text-[0.65rem] uppercase tracking-[0.15em] text-[#888]">
              AI Goal Assistant
            </span>
            <h3 className="font-display text-lg mt-0.5">{getPhaseTitle(phase)}</h3>
          </div>
          <div className="flex items-center gap-3">
            {/* Model selector */}
            {phase === "chatting" && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoading || messages.length > 1}
                className="text-xs px-2 py-1.5 border border-black/10 rounded-lg bg-white focus:outline-none focus:border-black/30 disabled:opacity-50"
              >
                {AI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content based on phase */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {phase === "chatting" && (
              <motion.div
                key="chatting"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full"
              >
                {renderChatPhase()}
              </motion.div>
            )}
            {phase === "reviewing" && (
              <motion.div
                key="reviewing"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full overflow-y-auto"
              >
                {renderReviewPhase()}
              </motion.div>
            )}
            {phase === "scheduling" && (
              <motion.div
                key="scheduling"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full overflow-y-auto"
              >
                {renderSchedulingPhase()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default GoalChatPalette;
