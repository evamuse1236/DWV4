import { useState, type ChangeEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
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

/**
 * Presentation Queue Page
 * Review and approve student book presentation requests
 */
export function PresentationQueuePage() {
  const presentationRequests = useQuery(api.books.getPresentationRequests);
  const approvePresentationRequest = useMutation(api.books.approvePresentationRequest);

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

    await approvePresentationRequest({
      studentBookId: confirmDialog.request._id as any,
      approved: confirmDialog.type === "approve",
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
        <h1 className="text-2xl font-serif font-semibold">Presentation Queue</h1>
        <p className="text-muted-foreground">
          Review and approve student book presentation requests
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
              {presentationRequests?.length || 0}
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
              {presentationRequests?.filter(
                (r: any) =>
                  r.presentationRequestedAt &&
                  new Date(r.presentationRequestedAt).toDateString() ===
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
              {presentationRequests && presentationRequests.length > 0
                ? Math.ceil(
                    (Date.now() -
                      Math.min(
                        ...presentationRequests.map((r: any) => r.presentationRequestedAt || Date.now())
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
      <div>
        <h2 className="text-lg font-semibold mb-1">Pending Presentation Requests</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Students ready to present their book readings to the class
        </p>
      </div>

      {presentationRequests && presentationRequests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {presentationRequests.map((request: any) => (
            <div
              key={request._id}
              className="group rounded-xl border bg-card shadow-sm p-5 hover:bg-accent/40 transition-colors"
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
                  {request.presentationRequestedAt
                    ? formatDate(request.presentationRequestedAt)
                    : "Unknown"}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="font-medium text-sm truncate">
                  {request.book?.title}
                </p>
              </div>
              {request.book?.author && (
                <p className="text-sm text-muted-foreground mb-3 ml-6">
                  by {request.book.author}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {request.book?.genre && (
                    <Badge variant="outline">{request.book.genre}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openConfirmDialog("reject", request)}
                  >
                    Not Yet
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openConfirmDialog("approve", request)}
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
          <p className="text-muted-foreground">No pending presentation requests</p>
          <p className="text-sm text-muted-foreground">
            Students will appear here when they finish reading and request to present
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && closeConfirmDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "approve"
                ? "Approve Presentation"
                : "Not Ready Yet"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "approve" ? (
                <>
                  Confirm that <strong>{confirmDialog.request?.user?.displayName}</strong> has
                  successfully presented{" "}
                  <strong>{confirmDialog.request?.book?.title}</strong>.
                </>
              ) : (
                <>
                  Mark <strong>{confirmDialog.request?.user?.displayName}</strong> as not ready
                  to present <strong>{confirmDialog.request?.book?.title}</strong>. They can
                  request again when ready.
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
                    ? "Great presentation! ..."
                    : "Feedback for the student..."
                }
                value={note}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
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
                  Confirm Presentation
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

export default PresentationQueuePage;
