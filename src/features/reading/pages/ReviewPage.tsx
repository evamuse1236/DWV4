import { useMemo } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { bookStatusConfig, getBookBadgeClass, type BookStatus } from "@/shared/lib/status-utils";

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

/**
 * Review — the student's book review corner: finished books waiting on a
 * review, plus reviews already written with any coach feedback.
 */
export function ReviewPage() {
  const { user, token } = useAuth();

  const reviewBooks = useQuery(
    api.books.getStudentBooks,
    user && token ? { token, userId: user._id as any } : "skip"
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

  const writtenReviews = useMemo(
    () =>
      (reviewBooks || []).filter(
        (studentBook) => studentBook.book && studentBook.review && studentBook.review.trim()
      ),
    [reviewBooks]
  );

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <span
          aria-hidden
          className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-divider)] border-t-[var(--color-espresso)]"
        />
        <span className="font-display text-lg italic text-[var(--color-taupe)]">
          Opening your reviews…
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="mb-10">
        <h1>Review</h1>
        <p className="mt-2 text-sm text-[var(--color-taupe)]">
          Finished books, your reviews, and what your coach said about them.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border bg-white/70 p-4">
        <div>
          <h2 className="text-lg font-semibold">Books waiting on your review</h2>
          <p className="text-sm text-muted-foreground">
            Finished a book? Use these prompts if you want to share a review.
          </p>
        </div>
        {reviewBooks === undefined ? (
          <p className="text-sm text-muted-foreground">Loading your reading list...</p>
        ) : suggestedBookReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No finished books are waiting for a review right now. Finish a book and it will show
            up here.
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
                    {bookStatusConfig[studentBook.status as BookStatus]?.label ||
                      studentBook.status}
                  </span>
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
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

      <section className="space-y-4 rounded-xl border bg-white/70 p-4">
        <div>
          <h2 className="text-lg font-semibold">Reviews you have written</h2>
          <p className="text-sm text-muted-foreground">
            Your words, plus coach feedback when there is some.
          </p>
        </div>
        {reviewBooks === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : writtenReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews yet — your first one will live here.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {writtenReviews.map((studentBook) => (
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
                    {bookStatusConfig[studentBook.status as BookStatus]?.label ||
                      studentBook.status}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80">
                  {studentBook.review}
                </p>
                {studentBook.coachFeedback ? (
                  <div className="mt-3 rounded-lg bg-[var(--color-ss-sage)]/40 p-3 text-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-taupe)]">
                      Coach feedback
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{studentBook.coachFeedback}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ReviewPage;
