import { useState, useRef, useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { X, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface StudentData {
  _id: Id<"users">;
  displayName: string;
  batch?: string;
}

interface ExtractedStudentData {
  studentName: string;
  studentId: string;
  links: Array<{
    url: string;
    title: string;
    type: "presentation" | "document" | "video" | "other";
  }>;
  reflections: {
    didWell: string | null;
    projectDescription: string | null;
    couldImprove: string | null;
  };
}

interface ExtractedData {
  students: ExtractedStudentData[];
  summary: string;
}

interface ProjectDataChatProps {
  projectId: Id<"projects">;
  projectName: string;
  students: StudentData[];
  onClose: () => void;
}

function createMessage(role: "user" | "assistant", content: string): Message {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

const INITIAL_GREETING = `Hi! I'm here to help you enter project data quickly. You can tell me about student work in natural language - like "John's presentation is at [link], he did great research on solar panels."

I'll extract the data and confirm before saving. Ready when you are!`;

type ChatHistoryTurn = {
  role: "user" | "assistant";
  content: string;
};

function parseProjectDataResponse(content: string): {
  assistantText: string;
  extractedData: ExtractedData | null;
} {
  const dataMatch = content.match(/```project-data\s*([\s\S]*?)```/);
  if (!dataMatch) {
    return {
      assistantText: content.trim(),
      extractedData: null,
    };
  }

  try {
    const parsed = JSON.parse(dataMatch[1].trim()) as ExtractedData;
    const textBeforeJson = content.slice(0, dataMatch.index).trim();
    return {
      assistantText:
        textBeforeJson || "I found the following data. Want me to save it?",
      extractedData: parsed,
    };
  } catch {
    return {
      assistantText: content.trim(),
      extractedData: null,
    };
  }
}

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

export function ProjectDataChat({
  projectId,
  projectName,
  students,
  onClose,
}: ProjectDataChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryTurn[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<ExtractedData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const chatAction = useAction(api.ai.projectDataChat);
  const addLink = useMutation(api.projectLinks.add);
  const updateReflection = useMutation(api.projectReflections.update);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([{ id: "initial", role: "assistant", content: INITIAL_GREETING }]);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Refocus input after AI responds
  useEffect(() => {
    if (!isLoading && !isSaving) {
      inputRef.current?.focus();
    }
  }, [isLoading, isSaving]);

  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage = createMessage("user", trimmedInput);
    const nextHistory: ChatHistoryTurn[] = [
      ...chatHistory,
      { role: "user", content: trimmedInput },
    ];

    setMessages((prev) => [...prev, userMessage]);
    setChatHistory(nextHistory);
    setInputValue("");
    setIsLoading(true);
    setError(null);
    setPendingData(null);
    setSaveSuccess(false);

    try {
      const response = await chatAction({
        messages: nextHistory,
        projectName,
        students: students.map((s) => ({
          id: s._id,
          name: s.displayName,
          batch: s.batch,
        })),
      });

      const { assistantText, extractedData } = parseProjectDataResponse(
        response.content
      );
      const assistantMessage =
        assistantText || "I had trouble understanding that. Could you rephrase?";

      setPendingData(extractedData);
      setMessages((prev) => [...prev, createMessage("assistant", assistantMessage)]);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setError("Something went wrong. Please try again.");
      const fallbackMessage = "I had trouble processing that. Could you try again?";
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", fallbackMessage),
      ]);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: fallbackMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveData = async () => {
    if (!pendingData) return;

    setIsSaving(true);
    setError(null);

    try {
      // Save each student's data
      for (const student of pendingData.students) {
        const studentId = student.studentId as Id<"users">;

        // Add links
        for (const link of student.links) {
          await addLink({
            projectId,
            userId: studentId,
            url: link.url,
            title: link.title,
            linkType: link.type,
          });
        }

        // Update reflections (only non-null values)
        const hasReflectionData =
          student.reflections.didWell ||
          student.reflections.projectDescription ||
          student.reflections.couldImprove;

        if (hasReflectionData) {
          await updateReflection({
            projectId,
            userId: studentId,
            didWell: student.reflections.didWell || undefined,
            projectDescription:
              student.reflections.projectDescription || undefined,
            couldImprove: student.reflections.couldImprove || undefined,
          });
        }
      }

      setSaveSuccess(true);
      setPendingData(null);

      // Add confirmation message
      setMessages((prev) => [
        ...prev,
        createMessage(
          "assistant",
          `Saved! ${pendingData.summary || "Data has been recorded."}\n\nWhat's next?`
        ),
      ]);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save data. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardData = () => {
    setPendingData(null);
    setMessages((prev) => [
      ...prev,
      createMessage(
        "assistant",
        "No problem, I discarded that data. What would you like to do instead?"
      ),
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 w-[420px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] flex flex-col bg-[#faf9f6] rounded-2xl shadow-2xl border border-black/10 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between bg-white">
        <div>
          <span className="text-[0.65rem] uppercase tracking-[0.15em] text-[#888]">
            AI Assistant
          </span>
          <h3 className="font-serif text-base">Project Data Entry</h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 opacity-50" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-[#1a1a1a] text-white rounded-br-md"
                    : "bg-white border border-black/10 rounded-bl-md"
                }`}
              >
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}

        {/* Pending Data Preview */}
        {pendingData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-4"
          >
            <h4 className="text-sm font-medium mb-2">Ready to save:</h4>
            <div className="space-y-2 text-sm">
              {pendingData.students.map((student, i) => (
                <div key={i} className="bg-white rounded-lg p-3">
                  <p className="font-medium">{student.studentName}</p>
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    {student.links.length > 0 && (
                      <p>
                        {student.links.length} link
                        {student.links.length !== 1 && "s"}
                      </p>
                    )}
                    {student.reflections.didWell && <p>Did well</p>}
                    {student.reflections.projectDescription && (
                      <p>Project desc</p>
                    )}
                    {student.reflections.couldImprove && <p>Could improve</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleSaveData}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-3 w-3" />
                )}
                Save Data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDiscardData}
                disabled={isSaving}
              >
                Discard
              </Button>
            </div>
          </motion.div>
        )}

        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 text-green-600 text-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Data saved successfully!</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-black/10 p-3 bg-white/50">
        {error && (
          <div className="flex items-center gap-2 text-destructive text-xs mb-2">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me about student work..."
            disabled={isLoading || isSaving}
            className="flex-1 px-4 py-2.5 border border-black/10 rounded-xl text-sm focus:outline-none focus:border-black/30 disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || isSaving}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Tip: Mention student names and URLs - I'll extract the data automatically
        </p>
      </div>
    </motion.div>
  );
}

export default ProjectDataChat;
