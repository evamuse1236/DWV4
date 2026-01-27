import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ArrowLeft } from "@phosphor-icons/react";
import type { VisionBoardArea } from "@/hooks/useVisionBoard";
import { PhIcon, ICON_OPTIONS } from "./PhIcon";

interface Props {
  areas: VisionBoardArea[];
  selectedAreaId: string | null;
  onSelectArea: (id: string | null) => void;
  onNewGoal: () => void;
  onAddArea: (name: string, emoji: string) => void;
}

export function VisionBoardFAB({
  areas,
  selectedAreaId,
  onSelectArea,
  onNewGoal,
  onAddArea,
}: Props) {
  const [open, setOpen] = useState(false);
  const [creatingArea, setCreatingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaIcon, setNewAreaIcon] = useState("Star");
  const containerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (creatingArea) {
          setCreatingArea(false);
        } else {
          setOpen(false);
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, creatingArea]);

  // Reset creation state when menu closes
  useEffect(() => {
    if (!open) {
      setCreatingArea(false);
      setNewAreaName("");
      setNewAreaIcon("Star");
    }
  }, [open]);

  // Auto-focus name input when entering creation mode
  useEffect(() => {
    if (creatingArea) {
      nameInputRef.current?.focus();
    }
  }, [creatingArea]);

  function handleCreateArea() {
    const name = newAreaName.trim();
    if (!name) return;
    onAddArea(name, newAreaIcon);
    setCreatingArea(false);
    setNewAreaName("");
    setNewAreaIcon("Star");
  }

  return (
    <div
      ref={containerRef}
      className="fixed bottom-8 right-8 z-50 flex flex-col items-end"
    >
      {/* Drop-up menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            className="mb-3 flex flex-col gap-2 min-w-[220px]"
          >
            <AnimatePresence mode="wait">
              {creatingArea ? (
                /* ---- New Area form ---- */
                <motion.div
                  key="create-area"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCreatingArea(false)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
                    >
                      <ArrowLeft size={14} weight="bold" className="opacity-50" />
                    </button>
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] opacity-50">
                      New Area
                    </span>
                  </div>

                  {/* Name input */}
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateArea();
                    }}
                    placeholder="Area name..."
                    className="w-full px-3 py-2 rounded-xl border border-black/5 bg-white/60 text-sm font-body
                               outline-none focus:border-[var(--color-primary)] transition-colors"
                  />

                  {/* Icon picker grid */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-40 block mb-1.5">
                      Icon
                    </label>
                    <div className="grid grid-cols-6 gap-1">
                      {ICON_OPTIONS.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setNewAreaIcon(name)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            newAreaIcon === name
                              ? "bg-[var(--color-primary)]/15 ring-2 ring-[var(--color-primary)]/40 scale-110"
                              : "hover:bg-black/5 hover:scale-105"
                          }`}
                        >
                          <PhIcon name={name} size={16} className="opacity-70" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Create button */}
                  <button
                    type="button"
                    onClick={handleCreateArea}
                    disabled={!newAreaName.trim()}
                    className="w-full py-2 rounded-xl bg-[var(--color-text)] text-white text-sm font-semibold
                               transition-all hover:brightness-110 active:scale-[0.97]
                               disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Create Area
                  </button>
                </motion.div>
              ) : (
                /* ---- Normal menu ---- */
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  {/* Area filter card */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-1.5">
                    <AreaButton
                      active={selectedAreaId === null}
                      icon="Star"
                      label="All Goals"
                      onClick={() => {
                        onSelectArea(null);
                        setOpen(false);
                      }}
                    />
                    {areas.map((area) => (
                      <AreaButton
                        key={area.id}
                        active={selectedAreaId === area.id}
                        icon={area.emoji}
                        label={area.name}
                        onClick={() => {
                          onSelectArea(area.id);
                          setOpen(false);
                        }}
                      />
                    ))}

                    {/* New Area button */}
                    <button
                      type="button"
                      onClick={() => setCreatingArea(true)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-left font-body text-[12px]
                                 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all
                                 font-semibold tracking-wide mt-0.5 border-t border-black/[0.04]"
                    >
                      <Plus size={16} weight="bold" className="shrink-0" />
                      <span>New Area</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Goal action — always visible */}
            {!creatingArea && (
              <button
                type="button"
                onClick={() => {
                  onNewGoal();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[var(--color-text)] text-white font-body text-sm font-semibold tracking-wide shadow-lg transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.97]"
              >
                <Plus size={18} weight="bold" />
                New Goal
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bubble */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        className="w-14 h-14 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg flex items-center justify-center text-[var(--color-text)] transition-colors hover:bg-white/90"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          <Plus size={24} />
        </motion.div>
      </motion.button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal sub-component
// ---------------------------------------------------------------------------

function AreaButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-left font-body text-sm transition-all ${
        active
          ? "bg-[var(--color-primary)]/15 text-[var(--color-text)] font-semibold"
          : "text-[var(--color-text-muted)] hover:bg-black/[0.03] hover:text-[var(--color-text)]"
      }`}
    >
      <PhIcon name={icon} size={18} className="opacity-70 shrink-0" />
      <span className="truncate">{label}</span>
      {active && (
        <Check size={16} weight="bold" className="ml-auto opacity-60 shrink-0" />
      )}
    </button>
  );
}
