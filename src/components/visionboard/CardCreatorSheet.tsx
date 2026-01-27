import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type {
  VisionBoardArea,
  VisionBoardCard,
  CardType,
  CardSize,
  ColorVariant,
} from "@/hooks/useVisionBoard";
import { DEFAULT_SIZE, ALLOWED_SIZES } from "@/hooks/useVisionBoard";
import { PhIcon, ICON_OPTIONS } from "./PhIcon";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARD_TYPE_META: { type: CardType; label: string; icon: string; desc: string }[] = [
  { type: "image_hero", label: "Hero Image", icon: "ImageSquare", desc: "Big visual + progress bar" },
  { type: "counter", label: "Counter", icon: "ChartBar", desc: "Track a count toward a goal" },
  { type: "progress", label: "Progress", icon: "Target", desc: "Segmented step tracker" },
  { type: "streak", label: "Streak", icon: "Fire", desc: "Keep a streak going" },
  { type: "habits", label: "Habits", icon: "CheckSquare", desc: "Daily habit checklist" },
  { type: "mini_tile", label: "Mini Tile", icon: "Diamond", desc: "Small icon + label" },
  { type: "motivation", label: "Motivation", icon: "Lightning", desc: "Inspiring title card" },
  { type: "journal", label: "Journal", icon: "Notebook", desc: "Text + reflection" },
];

const COLOR_OPTIONS: { value: ColorVariant; label: string; className: string }[] = [
  { value: "green", label: "Green", className: "bg-[var(--color-pastel-green)]" },
  { value: "blue", label: "Blue", className: "bg-[var(--color-pastel-blue)]" },
  { value: "pink", label: "Pink", className: "bg-[var(--color-pastel-pink)]" },
  { value: "purple", label: "Purple", className: "bg-[var(--color-pastel-purple)]" },
  { value: "orange", label: "Orange", className: "bg-[var(--color-pastel-orange)]" },
  { value: "yellow", label: "Yellow", className: "bg-[var(--color-pastel-yellow)]" },
];

const STEP_LABELS = ["Area", "Type", "Details"];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            className={cn(
              "rounded-full transition-colors duration-300",
              i === current
                ? "bg-[var(--color-text)]"
                : i < current
                  ? "bg-[var(--color-primary)]"
                  : "bg-black/10",
            )}
            animate={{
              width: i === current ? 24 : 8,
              height: 8,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-40 block mb-2.5">
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Slide animation variants
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 50 : -50,
    scale: 0.98,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -50 : 50,
    scale: 0.98,
  }),
};

const slideTransition = {
  type: "spring" as const,
  stiffness: 350,
  damping: 32,
  mass: 0.8,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areas: VisionBoardArea[];
  onAdd: (card: Omit<VisionBoardCard, "id" | "order" | "createdAt">) => void;
  defaultAreaId?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CardCreatorSheet({ open, onOpenChange, areas, onAdd, defaultAreaId }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Step 1: area
  const [selectedArea, setSelectedArea] = useState<string>("");

  // Step 2: card type
  const [selectedType, setSelectedType] = useState<CardType | null>(null);

  // Step 3: config
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState<ColorVariant>("green");
  const [size, setSize] = useState<CardSize>("md");
  const [imageUrl, setImageUrl] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [targetCount, setTargetCount] = useState(10);
  const [countLabel, setCountLabel] = useState("");
  const [description, setDescription] = useState("");
  const [totalSteps, setTotalSteps] = useState(6);
  const [stepsLabel, setStepsLabel] = useState("");
  const [quote, setQuote] = useState("");
  const [habitsText, setHabitsText] = useState("");
  const [textContent, setTextContent] = useState("");

  // When opening, if a defaultAreaId is provided, skip step 0
  useEffect(() => {
    if (open && defaultAreaId) {
      setSelectedArea(defaultAreaId);
      setDirection(1);
      setStep(1);
    }
  }, [open, defaultAreaId]);

  function goTo(nextStep: number) {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  }

  function reset() {
    setStep(0);
    setDirection(1);
    setSelectedArea("");
    setSelectedType(null);
    setTitle("");
    setSubtitle("");
    setIcon("");
    setColor("green");
    setSize("md");
    setImageUrl("");
    setProgressPercent(0);
    setTargetCount(10);
    setCountLabel("");
    setDescription("");
    setTotalSteps(6);
    setStepsLabel("");
    setQuote("");
    setHabitsText("");
    setTextContent("");
  }

  function handleCreate() {
    if (!selectedType || !selectedArea || !title.trim()) return;

    const card: Omit<VisionBoardCard, "id" | "order" | "createdAt"> = {
      areaId: selectedArea,
      cardType: selectedType,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      emoji: icon || undefined,
      colorVariant: color,
      size,
    };

    // Type-specific fields
    switch (selectedType) {
      case "image_hero":
        card.imageUrl = imageUrl || undefined;
        card.progressPercent = progressPercent;
        break;
      case "counter":
        card.currentCount = 0;
        card.targetCount = targetCount;
        card.countLabel = countLabel.trim() || undefined;
        break;
      case "progress":
        card.description = description.trim() || undefined;
        card.totalSteps = totalSteps;
        card.completedSteps = 0;
        card.stepsLabel = stepsLabel.trim() || undefined;
        break;
      case "streak":
        card.quote = quote.trim() || undefined;
        card.streakCount = 0;
        break;
      case "habits": {
        const habits = habitsText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((label) => ({ label, done: false }));
        card.habits = habits.length > 0 ? habits : [{ label: "New habit", done: false }];
        card.dayCount = 1;
        break;
      }
      case "motivation":
        card.dayCount = 1;
        break;
      case "journal":
        card.textContent = textContent.trim() || undefined;
        card.entryDate = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        break;
    }

    onAdd(card);
    reset();
    onOpenChange(false);
  }

  // When a type is selected, set its default size
  function selectType(t: CardType) {
    setSelectedType(t);
    setSize(DEFAULT_SIZE[t]);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent side="right" className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader className="mb-2">
          <SheetTitle className="font-display italic text-2xl">
            {step === 0 && "Choose Area"}
            {step === 1 && "Choose Card Type"}
            {step === 2 && "Configure Card"}
          </SheetTitle>
          <SheetDescription>
            {step === 0 && "What area of your life is this goal for?"}
            {step === 1 && "Pick the card style that fits best."}
            {step === 2 && "Fill in the details to create your card."}
          </SheetDescription>
        </SheetHeader>

        {/* Step progress indicator */}
        <StepIndicator current={step} total={3} />

        {/* Step label */}
        <div className="text-center mb-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-30">
            Step {step + 1} of 3 &middot; {STEP_LABELS[step]}
          </span>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {/* ----- Step 0: Area ----- */}
          {step === 0 && (
            <motion.div
              key="step0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="grid grid-cols-2 gap-3"
            >
              {areas.map((a) => (
                <motion.button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setSelectedArea(a.id);
                    goTo(1);
                  }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "p-5 rounded-2xl border text-left transition-colors",
                    "bg-white/60 border-white/80 hover:bg-white/80",
                    "hover:shadow-md",
                  )}
                >
                  <div className="block mb-2">
                    <PhIcon name={a.emoji} size={24} className="opacity-80" />
                  </div>
                  <span className="text-sm font-bold">{a.name}</span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ----- Step 1: Card Type ----- */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
              <div className="grid grid-cols-2 gap-3">
                {CARD_TYPE_META.map((m, i) => (
                  <motion.button
                    key={m.type}
                    type="button"
                    onClick={() => {
                      selectType(m.type);
                      goTo(2);
                    }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="p-4 rounded-2xl border bg-white/60 border-white/80 hover:bg-white/80
                               text-left transition-colors hover:shadow-md group"
                  >
                    <div className="mb-1.5 transition-transform group-hover:scale-110">
                      <PhIcon name={m.icon} size={22} className="opacity-70 group-hover:opacity-90 transition-opacity" />
                    </div>
                    <span className="text-sm font-bold block">{m.label}</span>
                    <span className="text-[11px] opacity-40 block mt-0.5 leading-tight">{m.desc}</span>
                  </motion.button>
                ))}
              </div>
              {!defaultAreaId && (
                <button
                  type="button"
                  onClick={() => goTo(0)}
                  className="mt-4 text-[11px] uppercase tracking-[0.1em] font-bold opacity-40 hover:opacity-70 transition-opacity"
                >
                  &larr; Back
                </button>
              )}
            </motion.div>
          )}

          {/* ----- Step 2: Configure ----- */}
          {step === 2 && selectedType && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="space-y-5"
            >
              {/* Title */}
              <div className="input-minimal-group">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder=" "
                  className="input-minimal"
                  autoFocus
                />
                <label className="input-label-floating">Title</label>
              </div>

              {/* Subtitle (hero, motivation) */}
              {(selectedType === "image_hero" || selectedType === "motivation") && (
                <div className="input-minimal-group">
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder=" "
                    className="input-minimal"
                  />
                  <label className="input-label-floating">Subtitle</label>
                </div>
              )}

              {/* Icon picker */}
              {selectedType !== "image_hero" && (
                <div>
                  <SectionLabel>Icon</SectionLabel>
                  <div className="grid grid-cols-8 gap-1.5 p-2 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                    {ICON_OPTIONS.map((name) => (
                      <motion.button
                        key={name}
                        type="button"
                        onClick={() => setIcon(name)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200",
                          icon === name
                            ? "bg-[var(--color-primary)]/20 ring-2 ring-[var(--color-primary)]/50 shadow-sm"
                            : "hover:bg-white/80",
                        )}
                      >
                        <PhIcon
                          name={name}
                          size={18}
                          className={cn(
                            "transition-opacity",
                            icon === name ? "opacity-90" : "opacity-50 hover:opacity-70",
                          )}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- Type-specific fields ---- */}

              {selectedType === "image_hero" && (
                <>
                  <div className="input-minimal-group">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder=" "
                      className="input-minimal"
                    />
                    <label className="input-label-floating">Image URL (optional)</label>
                  </div>
                  <div>
                    <SectionLabel>Progress: {progressPercent}%</SectionLabel>
                    <div className="relative">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={progressPercent}
                        onChange={(e) => setProgressPercent(Number(e.target.value))}
                        className="w-full accent-[var(--color-primary)]"
                      />
                      <div className="flex justify-between text-[9px] opacity-25 font-bold mt-0.5">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedType === "counter" && (
                <>
                  <div className="input-minimal-group">
                    <input
                      type="number"
                      value={targetCount}
                      onChange={(e) => setTargetCount(Number(e.target.value))}
                      placeholder=" "
                      className="input-minimal"
                      min={1}
                    />
                    <label className="input-label-floating">Target Count</label>
                  </div>
                  <div className="input-minimal-group">
                    <input
                      type="text"
                      value={countLabel}
                      onChange={(e) => setCountLabel(e.target.value)}
                      placeholder=" "
                      className="input-minimal"
                    />
                    <label className="input-label-floating">Label (e.g. Books read)</label>
                  </div>
                </>
              )}

              {selectedType === "progress" && (
                <>
                  <div className="input-minimal-group">
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder=" "
                      className="input-minimal"
                    />
                    <label className="input-label-floating">Description</label>
                  </div>
                  <div className="input-minimal-group">
                    <input
                      type="number"
                      value={totalSteps}
                      onChange={(e) => setTotalSteps(Number(e.target.value))}
                      placeholder=" "
                      className="input-minimal"
                      min={1}
                    />
                    <label className="input-label-floating">Total Steps</label>
                  </div>
                  <div className="input-minimal-group">
                    <input
                      type="text"
                      value={stepsLabel}
                      onChange={(e) => setStepsLabel(e.target.value)}
                      placeholder=" "
                      className="input-minimal"
                    />
                    <label className="input-label-floating">Steps Label (e.g. Lessons)</label>
                  </div>
                </>
              )}

              {selectedType === "streak" && (
                <div className="input-minimal-group">
                  <input
                    type="text"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder=" "
                    className="input-minimal"
                  />
                  <label className="input-label-floating">Inspiring Quote</label>
                </div>
              )}

              {selectedType === "habits" && (
                <div>
                  <SectionLabel>Habits (one per line)</SectionLabel>
                  <textarea
                    value={habitsText}
                    onChange={(e) => setHabitsText(e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-xl border border-black/5 bg-white/60 font-body text-sm
                               outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                    placeholder={"Water 2L\nNo Sugar\nWalking\nJournal"}
                  />
                </div>
              )}

              {selectedType === "journal" && (
                <div>
                  <SectionLabel>Initial Entry</SectionLabel>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-black/5 bg-white/60 font-body text-sm
                               outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                    placeholder="Today I'm grateful for..."
                  />
                </div>
              )}

              {/* ---- Divider ---- */}
              <div className="border-t border-black/[0.06] my-1" />

              {/* ---- Color picker ---- */}
              <div>
                <SectionLabel>Color</SectionLabel>
                <div className="flex gap-2.5">
                  {COLOR_OPTIONS.map((c) => (
                    <motion.button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full transition-all duration-200",
                          c.className,
                          c.value === color
                            ? "ring-2 ring-[var(--color-text)] ring-offset-2 shadow-sm"
                            : "ring-1 ring-black/[0.06]",
                        )}
                      />
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-[0.05em] transition-opacity",
                          c.value === color ? "opacity-70" : "opacity-0",
                        )}
                      >
                        {c.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* ---- Size picker ---- */}
              <div>
                <SectionLabel>Size</SectionLabel>
                <div className="flex gap-2 flex-wrap">
                  {ALLOWED_SIZES[selectedType].map((s) => (
                    <motion.button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] transition-all duration-200",
                        s === size
                          ? "bg-[var(--color-text)] text-white shadow-sm"
                          : "bg-white/60 border border-black/[0.06] hover:bg-white/80 hover:border-black/10",
                      )}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* ---- Actions ---- */}
              <div className="flex gap-3 pt-3">
                <motion.button
                  type="button"
                  onClick={handleCreate}
                  disabled={!title.trim()}
                  whileHover={title.trim() ? { scale: 1.02 } : undefined}
                  whileTap={title.trim() ? { scale: 0.98 } : undefined}
                  className="btn btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Create Card
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => goTo(1)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-secondary"
                >
                  Back
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
