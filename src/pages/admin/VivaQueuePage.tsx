import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
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

/**
 * Viva Queue Page
 * Review and approve student mastery claims
 */
export function VivaQueuePage() {
  const navigate = useNavigate();
  const vivaRequests = useQuery(api.objectives.getVivaRequests);
  const updateStatus = useMutation(api.objectives.updateStatus);

  // Dialog state for confirmations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "approve" | "reject";
    request: any | null;
  }>({ isOpen: false, type: "approve", request: null });
  const [note, setNote] = useState("");

  const openConfirmDialog = (type: "approve" | "reject", request: any) => {
    setConfirmDialog({ isOpen: true, type, request });
    setNote("");
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, type: "approve", request: null });
    setNote("");
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

      {/* Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Viva Requests</CardTitle>
          <CardDescription>
            Students ready to demonstrate mastery of their learning objectives
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vivaRequests && vivaRequests.length > 0 ? (
            <div className="space-y-4">
              {vivaRequests.map((request: any) => (
                <div
                  key={request._id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/students/${request.userId}`)}
                  title="View student details"
                >
                  {/* Student info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
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
                  </div>

                  {/* Objective info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm truncate">
                        {request.objective?.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{request.domain?.name}</Badge>
                      <Badge variant="secondary">
                        {request.objective?.difficulty}
                      </Badge>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-sm text-muted-foreground">
                    {request.vivaRequestedAt
                      ? formatDate(request.vivaRequestedAt)
                      : "Unknown"}
                  </div>

                  {/* Actions */}
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
        </CardContent>
      </Card>

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
