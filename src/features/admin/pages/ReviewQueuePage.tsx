import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { BookOpen, CheckCircle, Clock } from "lucide-react";

function formatDate(timestamp?: number) {
  if (!timestamp) return "Unknown";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-amber-500" : "text-muted-foreground/30"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function ReviewQueuePage() {
  const { user, token } = useAuth();
  const reviewSubmissions = useQuery(
    api.books.getReviewSubmissions,
    token ? { adminToken: token } : "skip"
  );
  const approveReview = useMutation(api.books.approveReview);
  const requestReviewChanges = useMutation(api.books.requestReviewChanges);

  const [expandedFeedbackFor, setExpandedFeedbackFor] = useState<string | null>(null);
  const [feedbackBySubmission, setFeedbackBySubmission] = useState<Record<string, string>>({});
  const [pendingActionFor, setPendingActionFor] = useState<string | null>(null);

  const handleApprove = async (submission: any) => {
    if (!token) return;
    const submissionId = String(submission._id);
    setPendingActionFor(submissionId);
    try {
      await approveReview({
        adminToken: token,
        studentBookId: submission._id as any,
        approvedBy: user?._id as any,
      });
    } finally {
      setPendingActionFor((current) => (current === submissionId ? null : current));
    }
  };

  const toggleFeedback = (submission: any) => {
    const submissionId = String(submission._id);
    setExpandedFeedbackFor((current) => (current === submissionId ? null : submissionId));
    setFeedbackBySubmission((current) =>
      current[submissionId] !== undefined
        ? current
        : { ...current, [submissionId]: submission?.coachFeedback || "" }
    );
  };

  const submitFeedback = async (submission: any) => {
    if (!token) return;
    const submissionId = String(submission._id);
    const feedback = (feedbackBySubmission[submissionId] || "").trim();
    if (!feedback) return;
    setPendingActionFor(submissionId);
    try {
      await requestReviewChanges({
        adminToken: token,
        studentBookId: submission._id as any,
        feedback,
        feedbackBy: user?._id as any,
      });
      setExpandedFeedbackFor((current) => (current === submissionId ? null : current));
    } finally {
      setPendingActionFor((current) => (current === submissionId ? null : current));
    }
  };

  const submissions = reviewSubmissions || [];
  const todayCount = submissions.filter((submission: any) => {
    const submittedAt =
      submission.reviewSubmittedAt ||
      submission.presentationRequestedAt ||
      submission.completedAt;
    if (!submittedAt) return false;
    return new Date(submittedAt).toDateString() === new Date().toDateString();
  }).length;

  const oldestDays = submissions.length
    ? Math.ceil(
        (Date.now() -
          Math.min(
            ...submissions.map(
              (submission: any) =>
                submission.reviewSubmittedAt ||
                submission.presentationRequestedAt ||
                submission.completedAt ||
                Date.now()
            )
          )) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Review Queue</h1>
        <p className="text-muted-foreground">
          Approve book reviews or request changes with feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{todayCount}</div>
            <p className="text-xs text-muted-foreground">Submitted today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oldest</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oldestDays}</div>
            <p className="text-xs text-muted-foreground">Days waiting</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Pending Review Submissions</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Students are marked done only after review approval.
        </p>
      </div>

      {submissions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {submissions.map((submission: any) => (
            <div
              key={submission._id}
              className="group rounded-xl border bg-card shadow-sm p-5 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={submission.user?.avatarUrl} alt={submission.user?.displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {submission.user?.displayName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{submission.user?.displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">@{submission.user?.username}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(
                    submission.reviewSubmittedAt ||
                      submission.presentationRequestedAt ||
                      submission.completedAt
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="font-medium text-sm truncate">{submission.book?.title}</p>
              </div>
              {submission.book?.author && (
                <p className="text-sm text-muted-foreground mb-2 ml-6">by {submission.book.author}</p>
              )}

              {submission.rating ? (
                <div className="mb-3 ml-6">
                  <StarRating rating={submission.rating} />
                </div>
              ) : null}

              <div className="rounded-md border bg-background/80 p-3 mb-3">
                <p className="text-sm whitespace-pre-wrap">
                  {submission.review?.trim() || "No review text submitted yet."}
                </p>
              </div>

              {submission.book?.genre && <Badge variant="outline">{submission.book.genre}</Badge>}

              <div className="flex items-center justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFeedback(submission)}
                  disabled={pendingActionFor === String(submission._id)}
                >
                  {expandedFeedbackFor === String(submission._id) ? "Cancel" : "Request Changes"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(submission)}
                  disabled={pendingActionFor === String(submission._id)}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  {pendingActionFor === String(submission._id) ? "Saving..." : "Approve"}
                </Button>
              </div>

              {expandedFeedbackFor === String(submission._id) ? (
                <div className="mt-3 rounded-lg border bg-background/80 p-3 space-y-2">
                  <label className="text-sm font-medium">Feedback for student</label>
                  <Textarea
                    value={feedbackBySubmission[String(submission._id)] || ""}
                    onChange={(event) =>
                      setFeedbackBySubmission((current) => ({
                        ...current,
                        [String(submission._id)]: event.target.value,
                      }))
                    }
                    placeholder="Tell the student what to improve..."
                    rows={4}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedFeedbackFor(null)}
                      disabled={pendingActionFor === String(submission._id)}
                    >
                      Close
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => submitFeedback(submission)}
                      disabled={
                        pendingActionFor === String(submission._id) ||
                        !(feedbackBySubmission[String(submission._id)] || "").trim()
                      }
                    >
                      {pendingActionFor === String(submission._id) ? "Saving..." : "Send Changes Request"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No pending review submissions</p>
          <p className="text-sm text-muted-foreground">
            Students appear here after submitting reviews.
          </p>
        </div>
      )}
    </div>
  );
}

export default ReviewQueuePage;
