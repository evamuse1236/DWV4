import { useState } from "react";
import { X } from "@phosphor-icons/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type {
  VisionBoardCard,
  ColorVariant,
  CardSize,
} from "@/hooks/useVisionBoard";
import { ALLOWED_SIZES } from "@/hooks/useVisionBoard";
import { PhIcon, ICON_OPTIONS } from "./PhIcon";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLOR_OPTIONS: { value: ColorVariant; label: string; className: string }[] = [
  { value: "green", label: "Green", className: "bg-[var(--color-pastel-green)]" },
  { value: "blue", label: "Blue", className: "bg-[var(--color-pastel-blue)]" },
  { value: "pink", label: "Pink", className: "bg-[var(--color-pastel-pink)]" },
  { value: "purple", label: "Purple", className: "bg-[var(--color-pastel-purple)]" },
  { value: "orange", label: "Orange", className: "bg-[var(--color-pastel-orange)]" },
  { value: "yellow", label: "Yellow", className: "bg-[var(--color-pastel-yellow)]" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  card: VisionBoardCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, patch: Partial<VisionBoardCard>) => void;
  onDelete: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CardDetailSheet({ card, open, onOpenChange, onUpdate, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!card) return null;

  function handleClose() {
    setConfirmDelete(false);
    onOpenChange(false);
  }

  function patch(p: Partial<VisionBoardCard>) {
    onUpdate(card!.id, p);
  }

  const allowed = ALLOWED_SIZES[card.cardType];

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <SheetContent side="right" className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display italic text-2xl flex items-center gap-2">
            {card.emoji && <PhIcon name={card.emoji} size={24} className="opacity-80" />}
            {card.title}
          </SheetTitle>
          <SheetDescription>
            Edit your card details below.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          {/* Title */}
          <div className="input-minimal-group">
            <input
              type="text"
              value={card.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder=" "
              className="input-minimal"
            />
            <label className="input-label-floating">Title</label>
          </div>

          {/* Subtitle */}
          {(card.cardType === "image_hero" || card.cardType === "motivation") && (
            <div className="input-minimal-group">
              <input
                type="text"
                value={card.subtitle ?? ""}
                onChange={(e) => patch({ subtitle: e.target.value })}
                placeholder=" "
                className="input-minimal"
              />
              <label className="input-label-floating">Subtitle</label>
            </div>
          )}

          {/* Icon picker */}
          {card.cardType !== "image_hero" && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40 block mb-2">
                Icon
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {ICON_OPTIONS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => patch({ emoji: name })}
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                      card.emoji === name
                        ? "bg-[var(--color-primary)]/15 ring-2 ring-[var(--color-primary)]/40 scale-110"
                        : "bg-white/60 hover:bg-white/80 hover:scale-105",
                    )}
                  >
                    <PhIcon name={name} size={18} className="opacity-70" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ---- Type-specific editing ---- */}

          {/* IMAGE HERO: progress slider + image url */}
          {card.cardType === "image_hero" && (
            <>
              <div className="input-minimal-group">
                <input
                  type="text"
                  value={card.imageUrl ?? ""}
                  onChange={(e) => patch({ imageUrl: e.target.value })}
                  placeholder=" "
                  className="input-minimal"
                />
                <label className="input-label-floating">Image URL</label>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40 block mb-2">
                  Progress: {card.progressPercent ?? 0}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={card.progressPercent ?? 0}
                  onChange={(e) => patch({ progressPercent: Number(e.target.value) })}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>
            </>
          )}

          {/* COUNTER: current / target */}
          {card.cardType === "counter" && (
            <div className="flex gap-4">
              <div className="flex-1 input-minimal-group">
                <input
                  type="number"
                  value={card.currentCount ?? 0}
                  onChange={(e) => patch({ currentCount: Number(e.target.value) })}
                  placeholder=" "
                  className="input-minimal"
                  min={0}
                />
                <label className="input-label-floating">Current</label>
              </div>
              <div className="flex-1 input-minimal-group">
                <input
                  type="number"
                  value={card.targetCount ?? 10}
                  onChange={(e) => patch({ targetCount: Number(e.target.value) })}
                  placeholder=" "
                  className="input-minimal"
                  min={1}
                />
                <label className="input-label-floating">Target</label>
              </div>
            </div>
          )}

          {/* PROGRESS: completed / total */}
          {card.cardType === "progress" && (
            <>
              <div className="input-minimal-group">
                <input
                  type="text"
                  value={card.description ?? ""}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder=" "
                  className="input-minimal"
                />
                <label className="input-label-floating">Description</label>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 input-minimal-group">
                  <input
                    type="number"
                    value={card.completedSteps ?? 0}
                    onChange={(e) => patch({ completedSteps: Number(e.target.value) })}
                    placeholder=" "
                    className="input-minimal"
                    min={0}
                  />
                  <label className="input-label-floating">Completed</label>
                </div>
                <div className="flex-1 input-minimal-group">
                  <input
                    type="number"
                    value={card.totalSteps ?? 6}
                    onChange={(e) => patch({ totalSteps: Number(e.target.value) })}
                    placeholder=" "
                    className="input-minimal"
                    min={1}
                  />
                  <label className="input-label-floating">Total Steps</label>
                </div>
              </div>
            </>
          )}

          {/* STREAK: quote + count */}
          {card.cardType === "streak" && (
            <>
              <div className="input-minimal-group">
                <input
                  type="text"
                  value={card.quote ?? ""}
                  onChange={(e) => patch({ quote: e.target.value })}
                  placeholder=" "
                  className="input-minimal"
                />
                <label className="input-label-floating">Quote</label>
              </div>
              <div className="input-minimal-group">
                <input
                  type="number"
                  value={card.streakCount ?? 0}
                  onChange={(e) => patch({ streakCount: Number(e.target.value) })}
                  placeholder=" "
                  className="input-minimal"
                  min={0}
                />
                <label className="input-label-floating">Streak Count</label>
              </div>
            </>
          )}

          {/* HABITS: list editing */}
          {card.cardType === "habits" && (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40 block mb-2">
                  Habits
                </label>
                <div className="space-y-2">
                  {(card.habits ?? []).map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={h.label}
                        onChange={(e) => {
                          const habits = [...(card.habits ?? [])];
                          habits[i] = { ...habits[i], label: e.target.value };
                          patch({ habits });
                        }}
                        className="flex-1 p-2 rounded-lg border border-black/5 bg-white/60 text-sm
                                   outline-none focus:border-[var(--color-primary)] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const habits = (card.habits ?? []).filter((_, idx) => idx !== i);
                          patch({ habits });
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-red-400
                                   hover:bg-red-50 transition-colors"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const habits = [...(card.habits ?? []), { label: "", done: false }];
                    patch({ habits });
                  }}
                  className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]
                             hover:underline transition-colors"
                >
                  + Add Habit
                </button>
              </div>
              <div className="input-minimal-group">
                <input
                  type="number"
                  value={card.dayCount ?? 1}
                  onChange={(e) => patch({ dayCount: Number(e.target.value) })}
                  placeholder=" "
                  className="input-minimal"
                  min={1}
                />
                <label className="input-label-floating">Day Count</label>
              </div>
            </>
          )}

          {/* MOTIVATION: day count */}
          {card.cardType === "motivation" && (
            <div className="input-minimal-group">
              <input
                type="number"
                value={card.dayCount ?? 1}
                onChange={(e) => patch({ dayCount: Number(e.target.value) })}
                placeholder=" "
                className="input-minimal"
                min={1}
              />
              <label className="input-label-floating">Day Count</label>
            </div>
          )}

          {/* JOURNAL: text content */}
          {card.cardType === "journal" && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40 block mb-2">
                Entry
              </label>
              <textarea
                value={card.textContent ?? ""}
                onChange={(e) => patch({ textContent: e.target.value })}
                rows={4}
                className="w-full p-3 rounded-xl border border-black/5 bg-white/60 font-body text-sm
                           outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
              />
            </div>
          )}

          {/* ---- Color picker ---- */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40 block mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => patch({ colorVariant: c.value })}
                  className={cn(
                    "w-9 h-9 rounded-full transition-all",
                    c.className,
                    c.value === card.colorVariant
                      ? "ring-2 ring-[var(--color-text)] ring-offset-2 scale-110"
                      : "hover:scale-105",
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* ---- Size picker ---- */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40 block mb-2">
              Size
            </label>
            <div className="flex gap-2 flex-wrap">
              {allowed.map((s: CardSize) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => patch({ size: s })}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] transition-all",
                    s === card.size
                      ? "bg-[var(--color-text)] text-white"
                      : "bg-white/60 border border-black/5 hover:bg-white/80",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ---- Danger zone ---- */}
          <div className="pt-4 border-t border-black/5">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-[11px] uppercase tracking-[0.1em] font-bold text-red-400
                           hover:text-red-600 transition-colors"
              >
                Delete Card
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-red-500">Are you sure?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(card.id);
                    handleClose();
                  }}
                  className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em]
                             bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] uppercase tracking-[0.08em] font-bold opacity-40 hover:opacity-70 transition-opacity"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
