import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import {
  extractImageSrc,
  findDiagnosticGroup,
  loadDiagnosticData,
  selectDeterministicQuestions,
  type DiagnosticQuestion,
} from "../../lib/diagnostic";
import { MathText } from "@/components/math/MathText";

type AttemptType = "practice" | "mastery";

const WARM_FEEDBACK_FALLBACK = "Nice try. Let's review this one together.";
const WARM_FEEDBACK_STARTER =
  /^(Nice try|Good try|Close|Almost|Oops|Careful|Not quite|It looks like|You're close|You’re close)/i;

function ensureWarmFeedbackTone(value: string | undefined | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return WARM_FEEDBACK_FALLBACK;

  let normalized = trimmed;
  while (/^misconception:\s*/i.test(normalized)) {
    normalized = normalized.replace(/^misconception:\s*/i, "").trim();
  }
  if (!normalized) return WARM_FEEDBACK_FALLBACK;
  if (WARM_FEEDBACK_STARTER.test(normalized)) return normalized;
  return `Nice try. ${normalized}`;
}

export function DiagnosticPage() {
  const { user } = useAuth();
  const { majorObjectiveId } = useParams<{ majorObjectiveId: string }>();
  const navigate = useNavigate();
  const attemptType: AttemptType = "mastery";

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

  // Quiz state
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [questions, setQuestions] = useState<DiagnosticQuestion[] | null>(null);
  const [qIndex, setQIndex] = useState(0);
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
      stem?: string;
    }>
  >([]);

  const [completedAttemptId, setCompletedAttemptId] = useState<string | null>(null);
  const [completedPassed, setCompletedPassed] = useState<boolean | null>(null);
  const [completedDurationMs, setCompletedDurationMs] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unlockActionError, setUnlockActionError] = useState<string | null>(null);

  const group = useMemo(() => {
    if (!modules || !majorMeta) return null;
    return findDiagnosticGroup(modules as any, majorMeta.section, majorMeta.moduleIndex);
  }, [modules, majorMeta]);

  const passThresholdPercent = unlockState?.policy?.passThresholdPercent ?? 90;
  const passThresholdScore = questions
    ? Math.ceil((questions.length * passThresholdPercent) / 100)
    : 0;

  const majorStatus = unlockState?.majorAssignment?.status;
  const hasPendingUnlockRequest = Boolean(unlockState?.pendingRequest);
  const requiresVivaRequest = unlockState?.policy?.requiresVivaRequest ?? false;
  const requiresUnlock = unlockState?.policy?.requiresUnlock ?? false;
  const canStartNow = unlockState?.policy?.canStart ?? false;

  useEffect(() => {
    setDataLoadingError(null);
    setModules(null);

    loadDiagnosticData()
      .then((data) => {
        setModules(data);
      })
      .catch((err: any) => setDataLoadingError(err?.message || "Failed to load diagnostic data"));
  }, []);

  const handleRequestUnlock = async () => {
    if (!user || !majorObjectiveId) return;
    try {
      setUnlockActionError(null);
      await requestUnlock({ userId: user._id as any, majorObjectiveId: majorObjectiveId as any });
    } catch (err: any) {
      setUnlockActionError(err?.message || "Failed to request unlock");
    }
  };

  const handleRequestViva = async () => {
    const studentMajorObjectiveId = unlockState?.majorAssignment?.studentMajorObjectiveId;
    if (!studentMajorObjectiveId) {
      setSubmitError("Could not find the module assignment for viva request.");
      return;
    }

    await updateMajorStatus({
      studentMajorObjectiveId: studentMajorObjectiveId as any,
      status: "viva_requested",
    });
    navigate("/deep-work");
  };

  const resetQuiz = () => {
    setStartedAt(null);
    setQuestions(null);
    setQIndex(0);
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
    if (!user || !majorObjectiveId || !group) return;

    const attemptCount = attemptCountResult?.count ?? 0;
    const targetCount = Math.max(1, Math.min(30, group.questionPool.length));
    const selected = selectDeterministicQuestions({
      questionPool: group.questionPool,
      count: targetCount,
      seed: `${user._id}:${majorObjectiveId}:${attemptCount}`,
    });

    setStartedAt(Date.now());
    setQuestions(selected);
    setQIndex(0);
    setSelectedIdx(null);
    setScore(0);
    setResults([]);
    setCompletedAttemptId(null);
    setCompletedPassed(null);
    setSubmitError(null);
    setUnlockActionError(null);
  };

  const currentQuestion = questions?.[qIndex] ?? null;

  const correctChoice = useMemo(() => {
    if (!currentQuestion) return null;
    return currentQuestion.choices.find((c) => c.correct) ?? null;
  }, [currentQuestion]);

  const buildQuestionResult = (choiceIdx: number | null) => {
    if (!currentQuestion) return null;
    const correctLabel = correctChoice?.label ?? "";
    const explanation = currentQuestion.explanation || "";

    if (choiceIdx === null) {
      return {
        questionId: currentQuestion.id,
        topic: currentQuestion.topic,
        chosenLabel: "Skipped",
        correctLabel,
        correct: false,
        misconception: "Skipped by student.",
        explanation,
        visualHtml: currentQuestion.visual_html || undefined,
        stem: currentQuestion.stem || undefined,
      };
    }

    const chosen = currentQuestion.choices[choiceIdx];
    const correct = Boolean(chosen?.correct);
    const chosenLabel = chosen?.label ?? "";
    const misconception = correct ? "" : ensureWarmFeedbackTone(chosen?.misconception);

    return {
      questionId: currentQuestion.id,
      topic: currentQuestion.topic,
      chosenLabel,
      correctLabel,
      correct,
      misconception,
      explanation,
      visualHtml: currentQuestion.visual_html || undefined,
      stem: currentQuestion.stem || undefined,
    };
  };

  const finalizeAttempt = async (finalResults: typeof results, finalScore: number) => {
    if (!questions || !user || !majorObjectiveId || !group || !startedAt || !majorMeta) return;
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
        score: finalScore,
        passed: finalScore >= passThresholdScore,
        startedAt,
        durationMs,
        results: finalResults,
      });

      // Commit final scored state only after submit succeeds.
      setScore(finalScore);
      setResults(finalResults);
      setCompletedAttemptId(String(res.attemptId));
      setCompletedPassed(Boolean(res.passed));
      setCompletedDurationMs(durationMs);
    } catch (err: any) {
      const message = err?.message || "Failed to submit attempt";
      setSubmitError(message);

      const likelyGateIssue =
        message.includes("Request viva before taking a retake.") ||
        message.includes("Diagnostic unlock required for retake.") ||
        message.includes("Diagnostic approval expired");

      // If backend gate changed while the quiz was in progress, return to gate UI.
      if (likelyGateIssue) {
        setStartedAt(null);
        setQuestions(null);
        setQIndex(0);
        setSelectedIdx(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAnswer = (choiceIdx: number) => {
    if (!currentQuestion || isSubmitting) return;
    setSelectedIdx(choiceIdx);
  };

  const handleNext = async () => {
    if (!questions || !currentQuestion || isSubmitting) return;
    if (selectedIdx === null) return;

    const nextResult = buildQuestionResult(selectedIdx);
    if (!nextResult) return;
    const nextScore = score + (nextResult.correct ? 1 : 0);
    const nextResults = [...results, nextResult];

    if (qIndex < questions.length - 1) {
      setScore(nextScore);
      setResults(nextResults);
      setQIndex((i) => i + 1);
      setSelectedIdx(null);
      setSubmitError(null);
      return;
    }

    await finalizeAttempt(nextResults, nextScore);
  };

  const handleSkipQuestion = async () => {
    if (!questions || !currentQuestion || isSubmitting) return;

    const nextResult = buildQuestionResult(null);
    if (!nextResult) return;
    const nextResults = [...results, nextResult];

    if (qIndex < questions.length - 1) {
      setResults(nextResults);
      setSelectedIdx(null);
      setSubmitError(null);
      setQIndex((i) => i + 1);
      return;
    }

    await finalizeAttempt(nextResults, score);
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
        <p className="text-muted-foreground">No diagnostic mapping found for this objective.</p>
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
        <p className="text-muted-foreground">Could not find the diagnostic question pool for this module.</p>
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

  // Pre-start gate
  if (!questions && completedPassed === null && !canStartNow) {
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
        <p className="text-muted-foreground mt-2">{group.moduleName}</p>

        <div className="mt-6 p-4 rounded border bg-white/70 space-y-3">
          {requiresVivaRequest && (
            <>
              <p className="text-sm text-muted-foreground">
                You must request viva after a failed attempt before retakes can be unlocked.
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded bg-black text-white"
                onClick={handleRequestViva}
                disabled={!unlockState?.majorAssignment?.studentMajorObjectiveId}
              >
                Request Viva
              </button>
            </>
          )}

          {!requiresVivaRequest && requiresUnlock && (
            <>
              <p className="text-sm text-muted-foreground">
                Retakes require coach unlock (24h, 1 attempt by default).
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                onClick={handleRequestUnlock}
                disabled={hasPendingUnlockRequest}
              >
                {hasPendingUnlockRequest ? "Diagnostic Requested" : "Request Diagnostic"}
              </button>
              {hasPendingUnlockRequest && (
                <p className="text-xs text-muted-foreground">Waiting for coach approval.</p>
              )}
            </>
          )}

          {unlockActionError && <p className="text-sm text-destructive">{unlockActionError}</p>}
        </div>
      </div>
    );
  }

  // Start screen
  if (!questions && completedPassed === null) {
    const expiresAt = unlockState?.activeUnlock?.expiresAt;
    const attemptsRemaining = unlockState?.activeUnlock?.attemptsRemaining;
    const quizLength = Math.max(1, Math.min(30, group.questionPool.length));
    const neededToPass = Math.ceil((quizLength * passThresholdPercent) / 100);

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
        <p className="text-muted-foreground mt-2">{group.moduleName} • Mastery attempt</p>

        <div className="mt-4 text-sm text-muted-foreground">
          <div>Questions: {quizLength}</div>
          <div>Pass: {passThresholdPercent}% ({neededToPass}/{quizLength})</div>
          {typeof attemptsRemaining === "number" && <div>Attempts remaining: {attemptsRemaining}</div>}
          {typeof expiresAt === "number" && (
            <div>Unlock expires: {new Date(expiresAt).toLocaleString()}</div>
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
    const vivaAlreadyRequested = majorStatus === "viva_requested";

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
            Score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%) {completedPassed ? "— Mastered" : "— Not yet"}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Pass target: {passThresholdScore}/{questions.length} ({passThresholdPercent}%)
          </div>
          {completedDurationMs !== null && (
            <div className="text-sm text-muted-foreground">
              Time (approx): {Math.round(completedDurationMs / 1000)}s
            </div>
          )}
          {completedAttemptId && (
            <div className="text-xs text-muted-foreground mt-1">Attempt saved: {completedAttemptId}</div>
          )}
        </div>

        {!completedPassed && (
          <>
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Let&apos;s Review Together</h2>
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
                className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                onClick={handleRequestViva}
                disabled={!unlockState?.majorAssignment?.studentMajorObjectiveId || vivaAlreadyRequested}
              >
                {vivaAlreadyRequested ? "Viva Requested" : "Request Viva"}
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
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-serif font-semibold">{title}</h1>
        <p className="text-muted-foreground mt-2">Preparing quiz…</p>
      </div>
    );
  }

  const imageSrc = extractImageSrc(currentQuestion.visual_html);
  const questionStem = currentQuestion.stem?.trim() || "";
  const visualHtml = currentQuestion.visual_html?.trim() || "";
  const total = questions.length;
  const isLast = qIndex === total - 1;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/deep-work")}
        >
          ← Back
        </button>
        <div className="text-sm text-muted-foreground">{group.moduleName}</div>
      </div>

      <h1 className="text-2xl font-serif font-semibold mt-4">{title}</h1>

      <div className="mt-6 p-6 rounded-xl border bg-white/70">
        <div className="text-base text-muted-foreground">Question {qIndex + 1} of {total}</div>
        <div className="mt-3 text-base text-muted-foreground">{currentQuestion.topic}</div>

        {questionStem && (
          <div className="mt-3 text-xl font-medium leading-relaxed whitespace-pre-wrap">
            <MathText text={questionStem} />
          </div>
        )}

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

        {!imageSrc && visualHtml && (
          <div
            className="mt-4 rounded-lg border bg-white p-3 text-sm"
            dangerouslySetInnerHTML={{ __html: visualHtml }}
          />
        )}

        <div className="mt-5 text-sm text-muted-foreground">
          If you do not know the answer, skipping is better than guessing.
        </div>

        <div className="mt-4 space-y-2">
          {currentQuestion.choices.map((c, idx) => {
            const isChosen = selectedIdx === idx;

            const base = "w-full text-left px-4 py-3 rounded-lg border text-base transition-colors";
            const idle = "bg-white hover:bg-muted/30";
            const selectedCls = "bg-foreground/5 border-foreground/40";

            let cls = `${base} ${idle}`;
            if (isChosen) cls = `${base} ${selectedCls}`;

            const labelText = c.text || c.label;

            return (
              <button
                key={`${currentQuestion.id}-${c.label}`}
                type="button"
                className={cls}
                disabled={isSubmitting}
                onClick={() => handleSelectAnswer(idx)}
              >
                <span className="font-semibold mr-2">{c.label}.</span>
                <MathText text={labelText} />
              </button>
            );
          })}
        </div>

        {submitError && <div className="mt-4 text-sm text-destructive">{submitError}</div>}

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Score: {score}/{total} • Pass target: {Math.ceil((total * passThresholdPercent) / 100)}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded border disabled:opacity-50"
              disabled={isSubmitting}
              onClick={handleSkipQuestion}
            >
              Skip
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              disabled={selectedIdx === null || isSubmitting}
              onClick={handleNext}
            >
              {isSubmitting ? "Submitting…" : isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiagnosticPage;
