import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useMutation } from "convex/react";
import { Sidebar } from "./Sidebar";
import { CheckInGate } from "./CheckInGate";
import { Changelog } from "./Changelog";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImagePlus, MessageSquare } from "lucide-react";

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
  const hideFloatingComment = pathname === "/vision-board";
  const submitComment = useMutation(api.studentComments.submit);
  const generateUploadUrl = useMutation(api.studentComments.generateUploadUrl);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const maxImages = 4;
  const imageInputId = "comment-images-input";
  const remainingImageSlots = Math.max(0, maxImages - commentImages.length);

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
    setCommentError(null);
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
        <Sidebar
          showCommentButton
          onOpenComment={() => {
            setCommentOpen(true);
            setCommentError(null);
          }}
        />

        {/* Changelog notification - hidden on Vision Board (full-bleed immersive page) */}
        {!hideChangelog && <Changelog />}

        {/* Main content - Uses page-wrapper class */}
        <main className="page-wrapper">
          <div className="container">
            <Outlet />
          </div>
        </main>

        {!hideFloatingComment && (
          <button
            type="button"
            onClick={() => setCommentOpen(true)}
            className="mobile-comment-trigger fixed bottom-5 right-5 z-40 h-11 w-11 items-center justify-center rounded-full bg-black text-white shadow-lg hover:bg-black/90"
            aria-label="Open comments"
            title="Comment"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}

        <Dialog
          open={commentOpen}
          onOpenChange={(open) => {
            setCommentOpen(open);
            if (!open) resetCommentForm();
          }}
        >
          <DialogContent className="max-w-md overflow-hidden border-divider bg-canvas shadow-[0_28px_64px_rgba(45,36,32,0.18)] sm:rounded-2xl">
            <DialogTitle className="sr-only">Add Comment & Images</DialogTitle>
            <div className="space-y-4">
              <p className="text-sm text-taupe">
                Tell us what is not working and add screenshots if helpful.
              </p>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your comment..."
                rows={5}
                className="border-divider bg-card-active text-espresso placeholder:text-taupe/70 focus-visible:ring-espresso/20"
              />
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-divider/80 pb-2">
                  <label
                    htmlFor={imageInputId}
                    className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-taupe"
                  >
                    Add images (optional)
                  </label>
                  <span className="text-[11px] font-medium text-taupe/80">
                    {remainingImageSlots} of {maxImages} slots left
                  </span>
                </div>
                <input
                  id={imageInputId}
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={remainingImageSlots === 0}
                  onChange={(e) => {
                    handleImagesSelected(e.target.files);
                    e.currentTarget.value = "";
                  }}
                  className="sr-only"
                />
                <label
                  htmlFor={imageInputId}
                  aria-disabled={remainingImageSlots === 0}
                  className={`group relative flex w-full items-center gap-3 rounded-2xl border border-dashed px-4 py-5 text-sm transition ${
                    remainingImageSlots === 0
                      ? "cursor-not-allowed border-divider/70 bg-white/40 opacity-60"
                      : "cursor-pointer border-divider bg-white/75 hover:border-primary/60 hover:bg-white"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-divider/80 bg-canvas shadow-sm transition-transform duration-200 group-hover:scale-105">
                    <ImagePlus className="h-4 w-4 text-espresso" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-lg italic leading-none text-espresso">
                      {commentImages.length > 0 ? "Add more screenshots" : "Choose screenshots"}
                    </p>
                    <p className="mt-1 text-xs text-taupe">
                      PNG, JPG, or WEBP. Up to {maxImages} images per comment.
                    </p>
                  </div>
                </label>
                {commentImages.length > 0 && (
                  <div className="space-y-2 rounded-2xl border border-divider bg-white/65 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-taupe">
                      Selected images
                    </p>
                    {commentImages.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-2 rounded-xl bg-card-active px-2.5 py-2 text-xs">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-espresso">{file.name}</p>
                          <p className="text-[11px] text-taupe">{Math.max(1, Math.round(file.size / 1024))} KB</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-taupe hover:bg-secondary/40 hover:text-espresso"
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
