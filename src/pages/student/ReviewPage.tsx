import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { extractImageSrc, loadDiagnosticData } from "../../lib/diagnostic";
import { MathText } from "@/components/math/MathText";

type AttemptListRow = {
  attemptId: string;
  attempt: {
    _id: string;
    passed: boolean;
    score: number;
    questionCount: number;
    scorePercent?: number;
    submittedAt: number;
    durationMs: number;
    diagnosticModuleName: string;
    attemptType: "practice" | "mastery";
  };
  majorObjective?: { _id: string; title?: string } | null;
  domain?: { _id: string; name?: string } | null;
};

type AttemptResult = {
  questionId: string;
  topic: string;
  chosenLabel: string;
  correctLabel: string;
  correct: boolean;
  misconception: string;
  explanation: string;
  visualHtml?: string;
  stem?: string;
};

type AttemptDetails = {
  attempt: {
    _id: string;
    score: number;
    questionCount: number;
    scorePercent?: number;
    passed: boolean;
    submittedAt: number;
    durationMs: number;
    diagnosticModuleName: string;
    results?: AttemptResult[];
  };
  majorObjective?: { _id: string; title?: string } | null;
  domain?: { _id: string; name?: string } | null;
};

export function ReviewPage() {
  const { user } = useAuth();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [questionChoiceTextById, setQuestionChoiceTextById] = useState<
    Record<string, Record<string, string>>
  >({});

  const attempts = useQuery(
    api.diagnostics.getStudentAttempts,
    user ? { userId: user._id as any } : "skip"
  ) as AttemptListRow[] | undefined;

  const details = useQuery(
    api.diagnostics.getStudentAttemptDetails,
    user && selectedAttemptId
      ? { userId: user._id as any, attemptId: selectedAttemptId as any }
      : "skip"
  ) as AttemptDetails | null | undefined;

  useEffect(() => {
    if (!attempts || attempts.length === 0) return;
    setSelectedAttemptId((prev) => prev ?? String(attempts[0].attemptId));
  }, [attempts]);

  useEffect(() => {
    let cancelled = false;
    loadDiagnosticData()
      .then((modules) => {
        if (cancelled) return;
        const nextMap: Record<string, Record<string, string>> = {};
        for (const module of modules ?? []) {
          for (const question of module.questions ?? []) {
            const byLabel: Record<string, string> = {};
            for (const choice of question.choices ?? []) {
              byLabel[choice.label] = choice.text ?? "";
            }
            nextMap[question.id] = byLabel;
          }
        }
        setQuestionChoiceTextById(nextMap);
      })
      .catch(() => {
        // Review works with labels even if bank lookup fails.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const wrongQuestions = useMemo(() => {
    const results = details?.attempt?.results ?? [];
    return results
      .map((result, idx) => ({ result, originalIndex: idx }))
      .filter((row) => !row.result.correct);
  }, [details]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (attempts === undefined) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif font-semibold">Review</h1>
        <p className="text-muted-foreground mt-2">Loading your diagnostic attempts...</p>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif font-semibold">Review</h1>
        <p className="text-muted-foreground mt-2">
          No diagnostic attempts yet. Finish a diagnostic and your review history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold">Review</h1>
        <p className="text-muted-foreground mt-2">
          Revisit previous diagnostics and focus on the exact questions you got wrong.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-xl border bg-white/70 p-3 space-y-2 max-h-[72vh] overflow-y-auto">
          {attempts.map((row) => {
            const isActive = selectedAttemptId === String(row.attemptId);
            const submitted = new Date(row.attempt.submittedAt).toLocaleString();
            return (
              <button
                key={row.attemptId}
                type="button"
                onClick={() => setSelectedAttemptId(String(row.attemptId))}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  isActive ? "border-black/30 bg-black/5" : "bg-white hover:bg-black/[0.03]"
                }`}
              >
                <div className="font-medium truncate">{row.majorObjective?.title || "Diagnostic"}</div>
                <div className="text-xs text-muted-foreground truncate mt-1">
                  {row.domain?.name || "Domain"} • {row.attempt.diagnosticModuleName}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {row.attempt.score}/{row.attempt.questionCount} •{" "}
                  {Math.round(row.attempt.scorePercent ?? 0)}% • {row.attempt.passed ? "Passed" : "Failed"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{submitted}</div>
              </button>
            );
          })}
        </aside>

        <section className="rounded-xl border bg-white/70 p-4">
          {!details ? (
            <div className="text-sm text-muted-foreground py-8">Loading attempt details...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-lg">{details.majorObjective?.title || "Diagnostic Review"}</div>
                  <div className="text-sm text-muted-foreground">
                    {details.domain?.name || "Domain"} • {details.attempt.diagnosticModuleName}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {details.attempt.score}/{details.attempt.questionCount} •{" "}
                  {Math.round(details.attempt.scorePercent ?? 0)}% •{" "}
                  {Math.round((details.attempt.durationMs || 0) / 1000)}s
                </div>
              </div>

              <div className="rounded-lg border bg-background/60 p-3 text-sm">
                Wrong questions in this attempt:{" "}
                <span className="font-semibold">
                  {wrongQuestions.length}/{details.attempt.questionCount}
                </span>
              </div>

              {wrongQuestions.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6">
                  Amazing work. No wrong questions recorded for this attempt.
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {wrongQuestions.map(({ result, originalIndex }) => {
                    const img = extractImageSrc(result.visualHtml);
                    const byLabel = questionChoiceTextById[result.questionId] ?? {};
                    const chosenText = result.chosenLabel ? byLabel[result.chosenLabel] : "";
                    const correctText = result.correctLabel ? byLabel[result.correctLabel] : "";

                    return (
                      <article
                        key={`${result.questionId}-${originalIndex}`}
                        className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3"
                      >
                        <div className="text-xs text-muted-foreground">
                          Question {originalIndex + 1} of {details.attempt.questionCount}
                        </div>

                        <div className="font-medium whitespace-pre-wrap">
                          {result.stem ? <MathText text={result.stem} /> : result.topic}
                        </div>

                        {result.stem && (
                          <div className="text-xs text-muted-foreground">{result.topic}</div>
                        )}

                        {img && (
                          <div className="flex justify-center bg-muted/40 rounded-md p-2">
                            <img
                              src={img}
                              alt="Diagnostic question"
                              className="max-w-full h-auto rounded"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="whitespace-pre-wrap">
                            <span className="font-medium text-foreground">You picked:</span>{" "}
                            <span className="font-medium">{result.chosenLabel}</span>
                            {chosenText ? (
                              <>
                                {" "}• <MathText text={chosenText} />
                              </>
                            ) : null}
                          </div>
                          <div className="whitespace-pre-wrap">
                            <span className="font-medium text-foreground">Correct answer:</span>{" "}
                            <span className="font-medium">{result.correctLabel}</span>
                            {correctText ? (
                              <>
                                {" "}• <MathText text={correctText} />
                              </>
                            ) : null}
                          </div>
                        </div>

                        {result.misconception && (
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            <span className="font-medium text-foreground">Practice note:</span>{" "}
                            <MathText text={result.misconception} />
                          </div>
                        )}

                        {result.explanation && (
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            <span className="font-medium text-foreground">Why:</span>{" "}
                            <MathText text={result.explanation} />
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ReviewPage;
