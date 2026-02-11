import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useMutation } from "convex/react";
import { Sidebar } from "./Sidebar";
import { CheckInGate } from "./CheckInGate";
import { Changelog } from "./Changelog";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

/**
 * Main dashboard layout with Paper UI sidebar and content area
 * Uses React Router's Outlet for nested routes
 * Wrapped in CheckInGate to enforce daily emotional check-in
 */
export function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const { pathname } = location;
  const hideChangelog = pathname === "/vision-board";
  const submitComment = useMutation(api.studentComments.submit);
  const generateUploadUrl = useMutation(api.studentComments.generateUploadUrl);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const maxImages = 4;

  const resetCommentForm = () => {
    setCommentText("");
    setCommentImages([]);
    setCommentError(null);
  };

  const handleImagesSelected = (files: FileList | null) => {
    if (!files) return;
    const chosen = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (chosen.length === 0) return;

    const availableSlots = maxImages - commentImages.length;
    if (availableSlots <= 0) {
      setCommentError(`You can upload up to ${maxImages} images.`);
      return;
    }

    const picked = chosen.slice(0, availableSlots);
    setCommentImages((prev) => [...prev, ...picked]);
    if (chosen.length > availableSlots) {
      setCommentError(`Only ${maxImages} images are allowed per comment.`);
    } else {
      setCommentError(null);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setCommentImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitComment = async () => {
    if (!user?._id) return;
    const message = commentText.trim();
    if (!message && commentImages.length === 0) {
      setCommentError("Please add a comment or at least one image.");
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const attachments: Array<{
        storageId: string;
        fileName: string;
        contentType?: string;
        sizeBytes?: number;
      }> = [];

      for (const file of commentImages) {
        const { uploadUrl } = await generateUploadUrl({});
        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Image upload failed (${uploadRes.status}).`);
        }

        const uploadJson = await uploadRes.json();
        if (!uploadJson?.storageId) {
          throw new Error("Image upload response missing storage id.");
        }

        attachments.push({
          storageId: String(uploadJson.storageId),
          fileName: file.name,
          contentType: file.type || undefined,
          sizeBytes: file.size,
        });
      }

      const route = `${location.pathname}${location.search}${location.hash}`;
      await submitComment({
        userId: user._id as any,
        message,
        route,
        pageTitle: document.title || undefined,
        pageUrl: window.location.href || undefined,
        attachments: attachments.length > 0 ? (attachments as any) : undefined,
      });
      resetCommentForm();
      setCommentOpen(false);
    } catch (err: any) {
      setCommentError(err?.message || "Failed to submit comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <CheckInGate>
      <div className="min-h-screen">
        {/* Sidebar - Uses CSS class from index.css */}
        <Sidebar />

        {/* Changelog notification - hidden on Vision Board (full-bleed immersive page) */}
        {!hideChangelog && <Changelog />}

        {/* Main content - Uses page-wrapper class */}
        <main className="page-wrapper">
          <div className="container">
            <Outlet />
          </div>
        </main>

        <button
          type="button"
          onClick={() => setCommentOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white shadow-lg hover:bg-black/90"
          aria-label="Open comments"
        >
          <MessageSquare className="h-4 w-4" />
          Comment
        </button>

        <Dialog
          open={commentOpen}
          onOpenChange={(open) => {
            setCommentOpen(open);
            if (!open) resetCommentForm();
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share a Comment</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tell us what is not working or what can be improved.
              </p>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your comment..."
                rows={5}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium block">Add images (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    handleImagesSelected(e.target.files);
                    e.currentTarget.value = "";
                  }}
                  className="block w-full text-sm"
                />
                {commentImages.length > 0 && (
                  <div className="space-y-1 rounded-md border bg-muted/30 p-2">
                    {commentImages.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate">
                          {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => removeImage(idx)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {commentError && <p className="text-sm text-destructive">{commentError}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCommentOpen(false);
                    resetCommentForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={isSubmittingComment}
                >
                  {isSubmittingComment ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </CheckInGate>
  );
}

export default DashboardLayout;
