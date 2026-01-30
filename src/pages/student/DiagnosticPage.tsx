import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import {
  extractImageSrc,
  findDiagnosticGroup,
  getSetForAttempt,
  loadDiagnosticData,
  loadDiagnosticSets,
  resolveSetQuestions,
  shuffleInPlace,
  type DiagnosticQuestion,
  type DiagnosticSet,
} from "../../lib/diagnostic";

type AttemptType = "practice" | "mastery";

function useAttemptTypeFromUrl(): AttemptType {
  const location = useLocation();
  return useMemo(() => {
    const type = new URLSearchParams(location.search).get("type");
    return type === "mastery" ? "mastery" : "practice";
  }, [location.search]);
}

export function DiagnosticPage() {
  const { user } = useAuth();
  const { majorObjectiveId } = useParams<{ majorObjectiveId: string }>();
  const navigate = useNavigate();
  const attemptType = useAttemptTypeFromUrl();

  const requestUnlock = useMutation(api.diagnostics.requestUnlock);
  const submitAttempt = useMutation(api.diagnostics.submitAttempt);
  const updateMajorStatus = useMutation(api.objectives.updateStatus);

  const majorMeta = useQuery(
    api.diagnostics.getCurriculumModuleIndex,
    majorObjectiveId ? { majorObjectiveId: majorObjectiveId as any } : "skip"
  );

  const unlockState = useQuery(
    api.diagnostics.getUnlockState,
    user && majorObjectiveId
      ? { userId: user._id as any, majorObjectiveId: majorObjectiveId as any }
      : "skip"
  );

  const attemptCountResult = useQuery(
    api.diagnostics.getAttemptCount,
    user && majorObjectiveId
      ? { userId: user._id as any, majorObjectiveId: majorObjectiveId as any }
      : "skip"
  );

  const [dataLoadingError, setDataLoadingError] = useState<string | null>(null);
  const [modules, setModules] = useState<any[] | null>(null);
  const [diagnosticSets, setDiagnosticSets] = useState<DiagnosticSet[] | null>(null);

  // Quiz state
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [questions, setQuestions] = useState<DiagnosticQuestion[] | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<
    Array<{
      questionId: string;
      topic: string;
      chosenLabel: string;
      correctLabel: string;
      correct: boolean;
      misconception: string;
      explanation: string;
      visualHtml?: string;
    }>
  >([]);

  const [completedAttemptId, setCompletedAttemptId] = useState<string | null>(null);
  const [completedPassed, setCompletedPassed] = useState<boolean | null>(null);
  const [completedDurationMs, setCompletedDurationMs] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const group = useMemo(() => {
    if (!modules || !majorMeta) return null;
    return findDiagnosticGroup(modules as any, majorMeta.section, majorMeta.moduleIndex);
  }, [modules, majorMeta]);

  const hasActiveUnlock = Boolean(unlockState?.activeUnlock);

  useEffect(() => {
    setDataLoadingError(null);
    setModules(null);
    setDiagnosticSets(null);

    Promise.all([loadDiagnosticData(), loadDiagnosticSets()])
      .then(([data, sets]) => {
        setModules(data);
        setDiagnosticSets(sets);
      })
      .catch((err: any) => setDataLoadingError(err?.message || "Failed to load diagnostic data"));
  }, []);

  const handleRequestUnlock = async () => {
    if (!user || !majorObjectiveId) return;
    await requestUnlock({ userId: user._id as any, majorObjectiveId: majorObjectiveId as any });
  };

  const resetQuiz = () => {
    setStartedAt(null);
    setQuestions(null);
    setQIndex(0);
    setAnswered(false);
    setSelectedIdx(null);
    setScore(0);
    setResults([]);
    setCompletedAttemptId(null);
    setCompletedPassed(null);
    setCompletedDurationMs(null);
    setIsSubmitting(false);
    setSubmitError(null);
  };

  const handleStartQuiz = () => {
    if (!user || !majorObjectiveId || !group || !majorMeta) return;

    const attemptCount = attemptCountResult?.count ?? 0;
    const prefix = majorMeta.section === "pyp"
      ? `PYP ${majorMeta.moduleIndex}:`
      : `Module ${majorMeta.moduleIndex}:`;

    let selected: DiagnosticQuestion[];

    // Try pre-built set first, fall back to random selection
    const set = diagnosticSets
      ? getSetForAttempt(diagnosticSets, prefix, attemptCount)
      : null;

    if (set) {
      selected = resolveSetQuestions(set, group.questionPool);
    } else {
      // Fallback: pick 30 random from pool
      const pool = group.questionPool.slice();
      shuffleInPlace(pool);
      selected = pool.slice(0, 30);
    }

    setStartedAt(Date.now());
    setQuestions(selected);
    setQIndex(0);
    setAnswered(false);
    setSelectedIdx(null);
    setScore(0);
    setResults([]);
    setCompletedAttemptId(null);
    setCompletedPassed(null);
    setSubmitError(null);
  };

  const currentQuestion = questions?.[qIndex] ?? null;

  const correctChoice = useMemo(() => {
    if (!currentQuestion) return null;
    return currentQuestion.choices.find((c) => c.correct) ?? null;
  }, [currentQuestion]);

  const handleSelectAnswer = (choiceIdx: number) => {
    if (!currentQuestion || answered) return;

    const chosen = currentQuestion.choices[choiceIdx];
    const correct = Boolean(chosen?.correct);
    const correctLabel = correctChoice?.label ?? "";
    const chosenLabel = chosen?.label ?? "";
    const misconception = chosen?.misconception || (correct ? "" : "Not quite.");
    const explanation = currentQuestion.explanation || "";

    setAnswered(true);
    setSelectedIdx(choiceIdx);
    if (correct) setScore((s) => s + 1);

    setResults((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        topic: currentQuestion.topic,
        chosenLabel,
        correctLabel,
        correct,
        misconception,
        explanation,
        visualHtml: currentQuestion.visual_html || undefined,
      },
    ]);
  };

  const handleNext = async () => {
    if (!questions) return;
    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
      setAnswered(false);
      setSelectedIdx(null);
      return;
    }

    if (!user || !majorObjectiveId || !group || !startedAt || !majorMeta) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const durationMs = Date.now() - startedAt;
      const res = await submitAttempt({
        userId: user._id as any,
        majorObjectiveId: majorObjectiveId as any,
        domainId: majorMeta.domainId as any,
        attemptType,
        diagnosticModuleName: group.moduleName,
        diagnosticModuleIds: group.moduleIds,
        questionCount: questions.length,
        score,
        passed: score === questions.length,
        startedAt,
        durationMs,
        results,
      });

      setCompletedAttemptId(String(res.attemptId));
      setCompletedPassed(Boolean(res.passed));
      setCompletedDurationMs(durationMs);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit attempt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestViva = async () => {
    const studentMajorObjectiveId = unlockState?.majorAssignment?.studentMajorObjectiveId;
    if (!studentMajorObjectiveId) return;
    await updateMajorStatus({
      studentMajorObjectiveId: studentMajorObjectiveId as any,
      status: "viva_requested",
    });
    navigate("/deep-work");
  };

  if (!majorObjectiveId) {
    return <div className="p-6">Missing major objective.</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  const title = majorMeta ? `${majorMeta.majorTitle} — Diagnostic` : "Diagnostic";

  if (dataLoadingError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-serif font-semibold mb-2">{title}</h1>
        <p className="text-destructive">{dataLoadingError}</p>
      </div>
    );
  }

  if (majorMeta === undefined || unlockState === undefined || modules === null) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-muted">Loading diagnostic...</div>
      </div>
    );
  }

  if (!majorMeta) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-serif font-semibold mb-2">{title}</h1>
        <p className="text-muted-foreground">
          No diagnostic mapping found for this objective.
        </p>
        <button
          type="button"
          className="mt-4 px-4 py-2 rounded bg-black text-white"
          onClick={() => navigate("/deep-work")}
        >
          Back to Deep Work
        </button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-serif font-semibold mb-2">{title}</h1>
        <p className="text-muted-foreground">
          Could not find the diagnostic question pool for this module.
        </p>
        <button
          type="button"
          className="mt-4 px-4 py-2 rounded bg-black text-white"
          onClick={() => navigate("/deep-work")}
        >
          Back to Deep Work
        </button>
      </div>
    );
  }

  // Unlock gate
  if (!hasActiveUnlock && !questions && completedPassed === null) {
    const pending = Boolean(unlockState?.pendingRequest);
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/deep-work")}
        >
          ← Back to Deep Work
        </button>

        <h1 className="text-2xl font-serif font-semibold mt-4">{title}</h1>
        <p className="text-muted-foreground mt-2">
          Diagnostics require coach approval. Request an unlock to begin.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={handleRequestUnlock}
            disabled={pending}
          >
            {pending ? "Requested" : "Request Diagnostic"}
          </button>
          {pending && (
            <span className="text-sm text-muted-foreground">
              Waiting for coach approval (valid for 24h once approved).
            </span>
          )}
        </div>
      </div>
    );
  }

  // Start screen
  if (!questions && completedPassed === null) {
    const expiresAt = unlockState?.activeUnlock?.expiresAt;
    const attemptsRemaining = unlockState?.activeUnlock?.attemptsRemaining;
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/deep-work")}
        >
          ← Back to Deep Work
        </button>

        <h1 className="text-2xl font-serif font-semibold mt-4">{title}</h1>
        <p className="text-muted-foreground mt-2">
          {group.moduleName} • {attemptType === "mastery" ? "Mastery attempt" : "Practice attempt"}
        </p>

        <div className="mt-4 text-sm text-muted-foreground">
          <div>Questions: 30 (pre-built set, rotates each attempt)</div>
          <div>Pass: 100% only</div>
          {typeof attemptsRemaining === "number" && (
            <div>Attempts remaining: {attemptsRemaining}</div>
          )}
          {typeof expiresAt === "number" && (
            <div>
              Unlock expires: {new Date(expiresAt).toLocaleString()}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded bg-black text-white"
            onClick={handleStartQuiz}
          >
            Start Diagnostic
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded border"
            onClick={resetQuiz}
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  // Results screen
  if (completedPassed !== null && questions) {
    const incorrect = results.filter((r) => !r.correct);
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/deep-work")}
        >
          ← Back to Deep Work
        </button>

        <h1 className="text-2xl font-serif font-semibold mt-4">{title}</h1>
        <p className="text-muted-foreground mt-2">{group.moduleName}</p>

        <div className="mt-6 p-4 rounded border bg-white/70">
          <div className="text-lg font-semibold">
            Score: {score}/{questions.length} {completedPassed ? "— Mastered" : "— Not yet"}
          </div>
          {completedDurationMs !== null && (
            <div className="text-sm text-muted-foreground">
              Time (approx): {Math.round(completedDurationMs / 1000)}s
            </div>
          )}
          {completedAttemptId && (
            <div className="text-xs text-muted-foreground mt-1">
              Attempt saved: {completedAttemptId}
            </div>
          )}
        </div>

        {!completedPassed && (
          <>
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">What went wrong</h2>
              {incorrect.length === 0 ? (
                <div className="text-muted-foreground">No misconceptions captured.</div>
              ) : (
                <div className="space-y-2">
                  {incorrect.map((r, i) => (
                    <div key={`${r.questionId}-${i}`} className="p-3 rounded border bg-white/70">
                      <div className="text-sm font-medium">{r.topic}</div>
                      <div className="text-sm text-muted-foreground">{r.misconception}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {group.kaLinks.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Practice links</h2>
                <div className="space-y-2">
                  {group.kaLinks.map((l) => (
                    <a
                      key={l.url}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded border bg-white/70 hover:bg-white"
                    >
                      <div className="text-sm font-medium">{l.label}</div>
                      <div className="text-xs text-muted-foreground break-all">{l.url}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded bg-black text-white"
                onClick={handleRequestViva}
                disabled={!unlockState?.majorAssignment?.studentMajorObjectiveId}
              >
                Request Viva
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded border"
                onClick={resetQuiz}
              >
                Done
              </button>
            </div>
          </>
        )}

        {completedPassed && (
          <div className="mt-6">
            <button
              type="button"
              className="px-4 py-2 rounded bg-black text-white"
              onClick={() => navigate("/deep-work")}
            >
              Back to Deep Work
            </button>
          </div>
        )}
      </div>
    );
  }

  // Quiz screen
  if (!questions || !currentQuestion) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-serif font-semibold">{title}</h1>
        <p className="text-muted-foreground mt-2">Preparing quiz…</p>
      </div>
    );
  }

  const imageSrc = extractImageSrc(currentQuestion.visual_html);
  const total = questions.length;
  const isLast = qIndex === total - 1;
  const chosen = selectedIdx !== null ? currentQuestion.choices[selectedIdx] : null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/deep-work")}
        >
          ← Back
        </button>
        <div className="text-sm text-muted-foreground">
          {group.moduleName}
        </div>
      </div>

      <h1 className="text-2xl font-serif font-semibold mt-4">{title}</h1>

      <div className="mt-6 p-5 rounded-xl border bg-white/70">
        <div className="text-sm text-muted-foreground">
          Question {qIndex + 1} of {total}
        </div>

        {imageSrc && (
          <div className="mt-4 flex justify-center bg-muted/40 rounded-lg p-3">
            <img
              src={imageSrc}
              alt="Diagnostic question"
              className="max-w-full h-auto rounded"
              loading="lazy"
            />
          </div>
        )}

        <div className="mt-4 text-lg font-medium">{currentQuestion.topic}</div>

        <div className="mt-4 space-y-2">
          {currentQuestion.choices.map((c, idx) => {
            const isCorrect = Boolean(c.correct);
            const isChosen = selectedIdx === idx;
            const showState = answered;

            const base =
              "w-full text-left px-4 py-3 rounded-lg border transition-colors";
            const idle = "bg-white hover:bg-muted/30";
            const correctCls = "bg-emerald-50 border-emerald-300";
            const wrongCls = "bg-orange-50 border-orange-300";

            let cls = `${base} ${idle}`;
            if (showState && isCorrect) cls = `${base} ${correctCls}`;
            if (showState && isChosen && !isCorrect) cls = `${base} ${wrongCls}`;

            const labelText = c.text || c.label;

            return (
              <button
                key={`${currentQuestion.id}-${c.label}`}
                type="button"
                className={cls}
                disabled={answered}
                onClick={() => handleSelectAnswer(idx)}
              >
                <span className="font-semibold mr-2">{c.label}.</span>
                {labelText}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-4 p-3 rounded-lg border bg-white">
            {chosen?.correct ? (
              <div className="text-sm">
                <div className="font-semibold text-emerald-700">Correct</div>
                {currentQuestion.explanation && (
                  <div className="text-muted-foreground mt-1">
                    {currentQuestion.explanation}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm">
                <div className="font-semibold text-orange-700">Not quite</div>
                <div className="text-muted-foreground mt-1">
                  {chosen?.misconception || "Review and try again later."}
                </div>
                {currentQuestion.explanation && (
                  <div className="text-muted-foreground mt-2">
                    {currentQuestion.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {submitError && (
          <div className="mt-4 text-sm text-destructive">{submitError}</div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Score: {score}/{total}
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={!answered || isSubmitting}
            onClick={handleNext}
          >
            {isSubmitting ? "Submitting…" : isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiagnosticPage;
