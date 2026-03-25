import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { extractImageSrc, loadDiagnosticData } from "@/shared/lib/diagnostic";
import { MathText } from "@/shared/ui/math/MathText";
import { bookStatusConfig, getBookBadgeClass, type BookStatus } from "@/shared/lib/status-utils";

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

type StudentBookStatus =
  | "reading"
  | "completed"
  | "review_draft"
  | "review_submitted"
  | "review_changes_requested"
  | "review_approved"
  | "presentation_requested"
  | "presented";

type ReviewBookRow = {
  _id: string;
  status: StudentBookStatus;
  coachFeedback?: string;
  review?: string;
  book?: { _id: string; title?: string; author?: string } | null;
};

const DONE_BOOK_STATUSES = new Set<StudentBookStatus>([
  "completed",
  "review_submitted",
  "review_changes_requested",
  "review_approved",
  "presentation_requested",
  "presented",
]);

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
  const reviewBooks = useQuery(
    api.books.getStudentBooks,
    user ? { userId: user._id as any } : "skip"
  ) as ReviewBookRow[] | undefined;

  const suggestedBookReviews = useMemo(
    () =>
      (reviewBooks || []).filter(
        (studentBook) =>
          DONE_BOOK_STATUSES.has(studentBook.status) &&
          studentBook.book &&
          !(studentBook.review && studentBook.review.trim())
      ),
    [reviewBooks]
  );

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

  const hasAttempts = (attempts?.length ?? 0) > 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold">Review</h1>
        <p className="text-muted-foreground mt-2">
          Revisit previous diagnostics and focus on the exact questions you got wrong.
        </p>
      </div>

      <section className="rounded-xl border bg-white/70 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Book Review Suggestions</h2>
            <p className="text-sm text-muted-foreground">
              Finished a book? Use these prompts if you want to share a review.
            </p>
          </div>
        </div>
        {reviewBooks === undefined ? (
          <p className="text-sm text-muted-foreground">Loading your reading list...</p>
        ) : suggestedBookReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No finished books are waiting for a review right now. Finish a book and it will show up here.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {suggestedBookReviews.map((studentBook) => (
              <article key={studentBook._id} className="rounded-lg border bg-background/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{studentBook.book?.title || "Book"}</div>
                    <div className="text-xs text-muted-foreground">
                      {studentBook.book?.author || "Unknown author"}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full ${getBookBadgeClass(
                      studentBook.status as BookStatus
                    )}`}
                  >
                    {bookStatusConfig[studentBook.status as BookStatus]?.label || studentBook.status}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground list-disc pl-4">
                  <li>What is the book about in 2-3 lines?</li>
                  <li>Which idea or moment stayed with you most, and why?</li>
                  <li>Who should read this, and what star rating would you give it?</li>
                </ul>
                {studentBook.book?._id ? (
                  <div className="mt-3">
                    <Link
                      to={`/reading?openBook=${studentBook.book._id}&view=review`}
                      className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm hover:bg-black/[0.03]"
                    >
                      Open Reading Page
                    </Link>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-xl border bg-white/70 p-3 space-y-2 max-h-[72vh] overflow-y-auto">
          {!hasAttempts ? (
            <p className="text-sm text-muted-foreground p-2">
              {attempts === undefined
                ? "Loading your diagnostic attempts..."
                : "No diagnostic attempts yet. Finish a diagnostic and your attempt history will appear here."}
            </p>
          ) : (
            attempts!.map((row) => {
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
                    {Math.round(row.attempt.scorePercent ?? 0)}% •{" "}
                    {row.attempt.passed ? "Passed" : "Failed"}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">{submitted}</div>
                </button>
              );
            })
          )}
        </aside>

        <section className="rounded-xl border bg-white/70 p-4">
          {!hasAttempts ? (
            <div className="text-sm text-muted-foreground py-8">
              Build your diagnostic history and revisit mistakes here after each attempt.
            </div>
          ) : !details ? (
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

              {details.majorObjective?._id ? (
                <div>
                  <Link
                    to={`/deep-work/mastery/${details.majorObjective._id}`}
                    className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm hover:bg-black/[0.03]"
                  >
                    Open Mastery Flow
                  </Link>
                </div>
              ) : null}

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
