import { useState } from "react";
import { cn } from "@/lib/utils";
import type { VisionBoardArea } from "@/hooks/useVisionBoard";

// Common emojis for custom area creation
const EMOJI_OPTIONS = [
  "🎯", "🎨", "🎵", "🌱", "💡", "🔥", "🏆", "💎",
  "🌟", "📖", "🧠", "❤️", "🎮", "🏋️", "✈️", "🍳",
  "💻", "🎸", "🐶", "🌊",
];

interface Props {
  areas: VisionBoardArea[];
  selectedAreaId: string | null;
  onSelect: (areaId: string | null) => void;
  onAddArea: (name: string, emoji: string) => void;
}

export function AreaFilter({ areas, selectedAreaId, onSelect, onAddArea }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎯");

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddArea(trimmed, newEmoji);
    setNewName("");
    setNewEmoji("🎯");
    setIsCreating(false);
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 flex-wrap">
        {/* "All" pill */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-200",
            selectedAreaId === null
              ? "bg-[var(--color-text)] text-white shadow-md"
              : "bg-white/50 hover:bg-white/70 border border-black/5",
          )}
        >
          All
        </button>

        {/* Area pills */}
        {areas.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.id === selectedAreaId ? null : a.id)}
            className={cn(
              "px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-200 flex items-center gap-2",
              a.id === selectedAreaId
                ? "bg-[var(--color-text)] text-white shadow-md"
                : "bg-white/50 hover:bg-white/70 border border-black/5",
            )}
          >
            <span className="text-sm">{a.emoji}</span>
            {a.name}
          </button>
        ))}

        {/* Add area button */}
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-9 h-9 rounded-full border-2 border-dashed border-black/10 flex items-center
                       justify-center text-black/30 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]
                       transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        )}
      </div>

      {/* Inline creation form */}
      {isCreating && (
        <div className="mt-4 flex items-start gap-4 p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Emoji grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setNewEmoji(e)}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                  e === newEmoji
                    ? "bg-[var(--color-primary)] text-white scale-110 shadow-sm"
                    : "hover:bg-black/5",
                )}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Name input + actions */}
          <div className="flex-1 flex flex-col gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder="Area name"
              className="input-minimal text-base"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="btn btn-primary text-[10px] px-5 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add Area
              </button>
              <button
                type="button"
                onClick={() => { setIsCreating(false); setNewName(""); }}
                className="btn btn-secondary text-[10px] px-5 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
