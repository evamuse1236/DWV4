import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { extractImageSrc } from "@/lib/diagnostic";

/**
 * Viva Queue Page
 * Review and approve student mastery claims
 */
export function VivaQueuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const vivaRequests = useQuery(api.objectives.getVivaRequests);
  const updateStatus = useMutation(api.objectives.updateStatus);
  const pendingUnlockRequests = useQuery(api.diagnostics.getPendingUnlockRequests);
  const diagnosticFailures = useQuery(api.diagnostics.getFailuresForQueue);
  const approveUnlock = useMutation(api.diagnostics.approveUnlock);
  const denyUnlock = useMutation(api.diagnostics.denyUnlock);

  // Dialog state for confirmations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "approve" | "reject";
    request: any | null;
  }>({ isOpen: false, type: "approve", request: null });
  const [note, setNote] = useState("");

  const [failureDialog, setFailureDialog] = useState<{
    isOpen: boolean;
    attemptId: string | null;
  }>({ isOpen: false, attemptId: null });

  const failureDetails = useQuery(
    api.diagnostics.getAttemptDetails,
    failureDialog.attemptId ? { attemptId: failureDialog.attemptId as any } : "skip"
  );

  const openConfirmDialog = (type: "approve" | "reject", request: any) => {
    setConfirmDialog({ isOpen: true, type, request });
    setNote("");
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, type: "approve", request: null });
    setNote("");
  };

  const openFailureDialog = (attemptId: string) => {
    setFailureDialog({ isOpen: true, attemptId });
  };

  const closeFailureDialog = () => {
    setFailureDialog({ isOpen: false, attemptId: null });
  };

  const handleConfirm = async () => {
    if (!confirmDialog.request) return;

    await updateStatus({
      studentMajorObjectiveId: confirmDialog.request._id as any,
      status: confirmDialog.type === "approve" ? "mastered" : "in_progress",
    });

    closeConfirmDialog();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleApproveUnlockRequest = async (requestId: string) => {
    if (!user?._id) return;
    await approveUnlock({
      requestId: requestId as any,
      approvedBy: user._id as any,
      expiresInMinutes: 1440,
      attemptsGranted: 1,
    });
  };

  const handleDenyUnlockRequest = async (requestId: string) => {
    if (!user?._id) return;
    await denyUnlock({
      requestId: requestId as any,
      deniedBy: user._id as any,
    });
  };

  const handleApproveDiagnosticMastery = async () => {
    const attempt = failureDetails?.attempt;
    if (!attempt?.studentMajorObjectiveId) return;
    await updateStatus({
      studentMajorObjectiveId: attempt.studentMajorObjectiveId as any,
      status: "mastered",
    });
    closeFailureDialog();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-semibold">Viva Queue</h1>
        <p className="text-muted-foreground">
          Review and approve student mastery demonstrations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vivaRequests?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {vivaRequests?.filter(
                (r: any) =>
                  r.vivaRequestedAt &&
                  new Date(r.vivaRequestedAt).toDateString() ===
                    new Date().toDateString()
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requested today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oldest</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vivaRequests && vivaRequests.length > 0
                ? Math.ceil(
                    (Date.now() -
                      Math.min(
                        ...vivaRequests.map((r: any) => r.vivaRequestedAt || Date.now())
                      )) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Days waiting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostic Unlock Requests */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Diagnostic Unlock Requests</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Approve a 24-hour, 1-attempt diagnostic window for students.
        </p>

        {pendingUnlockRequests && pendingUnlockRequests.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingUnlockRequests.map((req: any) => (
              <div
                key={req._id}
                className="rounded-xl border bg-card shadow-sm p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={req.user?.avatarUrl} alt={req.user?.displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {req.user?.displayName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{req.user?.displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      @{req.user?.username}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(req.requestedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="font-medium text-sm truncate">
                    {req.majorObjective?.title || req.majorObjectiveId}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {req.domain?.name && <Badge variant="outline">{req.domain.name}</Badge>}
                    {req.majorObjective?.curriculum && (
                      <Badge variant="secondary">{req.majorObjective.curriculum}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDenyUnlockRequest(req._id)}
                      disabled={!user?._id}
                    >
                      Deny
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveUnlockRequest(req._id)}
                      disabled={!user?._id}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No pending unlock requests</p>
            <p className="text-sm text-muted-foreground">
              Students will appear here when they request a diagnostic.
            </p>
          </div>
        )}
      </div>

      {/* Diagnostic Failures */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Diagnostic Failures</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Review what went wrong and run a directed viva.
        </p>

        {diagnosticFailures && diagnosticFailures.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {diagnosticFailures.map((row: any) => (
              <div
                key={row.attemptId}
                className="group rounded-xl border bg-card shadow-sm p-5 hover:bg-accent/40 transition-colors cursor-pointer"
                onClick={() => openFailureDialog(row.attemptId)}
                title="View attempt details"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={row.user?.avatarUrl} alt={row.user?.displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {row.user?.displayName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{row.user?.displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      @{row.user?.username}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(row.attempt.submittedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="font-medium text-sm truncate">
                    {row.majorObjective?.title}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {row.domain?.name && <Badge variant="outline">{row.domain.name}</Badge>}
                    <Badge variant="secondary">
                      {row.attempt.score}/{row.attempt.questionCount}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((row.attempt.durationMs || 0) / 1000)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No diagnostic failures</p>
          </div>
        )}
      </div>

      {/* Queue */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Pending Viva Requests</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Students ready to demonstrate mastery of their learning objectives
        </p>
      </div>

      {vivaRequests && vivaRequests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vivaRequests.map((request: any) => (
            <div
              key={request._id}
              className="group rounded-xl border bg-card shadow-sm p-5 hover:bg-accent/40 transition-colors cursor-pointer"
              onClick={() => navigate(`/admin/students/${request.userId}`)}
              title="View student details"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={request.user?.avatarUrl}
                    alt={request.user?.displayName}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {request.user?.displayName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {request.user?.displayName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{request.user?.username}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {request.vivaRequestedAt
                    ? formatDate(request.vivaRequestedAt)
                    : "Unknown"}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="font-medium text-sm truncate">
                  {request.objective?.title}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{request.domain?.name}</Badge>
                  <Badge variant="secondary">
                    {request.objective?.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirmDialog("reject", request);
                    }}
                  >
                    Not Yet
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirmDialog("approve", request);
                    }}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No pending viva requests</p>
          <p className="text-sm text-muted-foreground">
            Students will appear here when they request mastery verification
          </p>
        </div>
      )}

      {/* Diagnostic Failure Dialog */}
      <Dialog open={failureDialog.isOpen} onOpenChange={(open) => !open && closeFailureDialog()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Diagnostic Attempt Review</DialogTitle>
            <DialogDescription>
              Review mistakes and decide whether to approve mastery.
            </DialogDescription>
          </DialogHeader>

          {!failureDetails ? (
            <div className="py-6 text-sm text-muted-foreground">Loading attempt…</div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {failureDetails.user?.displayName} — {failureDetails.majorObjective?.title}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {failureDetails.domain?.name} • {failureDetails.attempt.diagnosticModuleName}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground shrink-0">
                  {failureDetails.attempt.score}/{failureDetails.attempt.questionCount} •{" "}
                  {Math.round((failureDetails.attempt.durationMs || 0) / 1000)}s
                </div>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {failureDetails.attempt.results
                  .filter((r: any) => !r.correct)
                  .map((r: any, idx: number) => {
                    const img = extractImageSrc(r.visualHtml);
                    return (
                      <div key={`${r.questionId}-${idx}`} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="font-medium text-sm">{r.topic}</div>
                          <Badge variant="secondary">
                            {r.chosenLabel} vs {r.correctLabel}
                          </Badge>
                        </div>

                        {img && (
                          <div className="mb-3 flex justify-center bg-muted/40 rounded-md p-2">
                            <img
                              src={img}
                              alt="Diagnostic question"
                              className="max-w-full h-auto rounded"
                              loading="lazy"
                            />
                          </div>
                        )}

                        {r.misconception && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Misconception:</span>{" "}
                            {r.misconception}
                          </div>
                        )}
                        {r.explanation && (
                          <div className="text-sm text-muted-foreground mt-2">
                            <span className="font-medium text-foreground">Explanation:</span>{" "}
                            {r.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {failureDetails.attempt.results.filter((r: any) => !r.correct).length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No incorrect questions recorded for this attempt.
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeFailureDialog}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (failureDetails?.attempt?.userId) {
                  navigate(`/admin/students/${failureDetails.attempt.userId}`);
                }
              }}
              disabled={!failureDetails?.attempt?.userId}
            >
              Open Student
            </Button>
            <Button
              onClick={handleApproveDiagnosticMastery}
              disabled={!failureDetails?.attempt?.studentMajorObjectiveId}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Approve Mastery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && closeConfirmDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "approve"
                ? "Approve Mastery"
                : "Not Ready Yet"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "approve" ? (
                <>
                  Confirm that <strong>{confirmDialog.request?.user?.displayName}</strong> has
                  demonstrated mastery of{" "}
                  <strong>{confirmDialog.request?.objective?.title}</strong>.
                </>
              ) : (
                <>
                  Mark <strong>{confirmDialog.request?.user?.displayName}</strong> as not ready
                  for <strong>{confirmDialog.request?.objective?.title}</strong>. They can
                  request another viva when ready.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Note (optional)
              </label>
              <Textarea
                placeholder={
                  confirmDialog.type === "approve"
                    ? "Great work on the demonstration..."
                    : "Feedback for the student..."
                }
                value={note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {confirmDialog.type === "reject"
                  ? "Help the student understand what they need to work on."
                  : "Optional feedback or recognition for the student."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirmDialog}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog.type === "approve" ? "default" : "secondary"}
              onClick={handleConfirm}
            >
              {confirmDialog.type === "approve" ? (
                <>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Confirm Mastery
                </>
              ) : (
                "Mark Not Ready"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VivaQueuePage;
