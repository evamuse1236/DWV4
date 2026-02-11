import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CommentsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("open");
  const [search, setSearch] = useState("");

  const comments = useQuery(api.studentComments.getForAdmin, {
    status: statusFilter,
    limit: 300,
  });
  const resolveComment = useMutation(api.studentComments.resolve);

  const filteredComments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return comments ?? [];
    return (comments ?? []).filter((row: any) => {
      const haystack = `${row.user?.displayName ?? row.commenterDisplayName ?? ""} ${row.user?.username ?? row.commenterUsername ?? ""} ${row.message ?? ""} ${row.majorObjective?.title ?? ""} ${row.route ?? ""} ${row.pageTitle ?? ""} ${row.pageUrl ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [comments, search]);

  const handleResolve = async (commentId: string) => {
    if (!user?._id) return;
    await resolveComment({
      commentId: commentId as any,
      resolvedBy: user._id as any,
    });
  };

  const formatDateTime = (timestamp: number) =>
    new Date(timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatFileSize = (sizeBytes?: number) => {
    if (!sizeBytes || sizeBytes <= 0) return null;
    if (sizeBytes < 1024 * 1024) return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Student Comments</h1>
        <p className="text-sm text-muted-foreground">
          Review feedback submitted by students from across the app.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student, module, or text"
          className="h-9 rounded-md border bg-background px-3 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "open" | "resolved")}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
        <div className="h-9 rounded-md border bg-muted/40 px-3 flex items-center text-sm text-muted-foreground">
          {filteredComments.length} comments
        </div>
      </div>

      {filteredComments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No comments match current filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredComments.map((row: any) => (
            <Card key={row._id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between gap-3">
                  <span className="truncate">
                    {row.user?.displayName ?? row.commenterDisplayName ?? "Unknown Student"}
                  </span>
                  <Badge variant={row.status === "open" ? "destructive" : "default"}>
                    {row.status.toUpperCase()}
                  </Badge>
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  @{row.user?.username ?? row.commenterUsername ?? "unknown"} • {formatDateTime(row.createdAt)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {row.message ? (
                  <p className="text-sm whitespace-pre-wrap">{row.message}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">No text message provided.</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {row.majorObjective?.title && (
                    <span className="rounded bg-muted px-2 py-1">{row.majorObjective.title}</span>
                  )}
                  {row.route && <span className="rounded bg-muted px-2 py-1">{row.route}</span>}
                  {row.pageTitle && <span className="rounded bg-muted px-2 py-1">{row.pageTitle}</span>}
                </div>

                {row.pageUrl && (
                  <a
                    href={row.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline underline-offset-2 break-all"
                  >
                    {row.pageUrl}
                  </a>
                )}

                {(row.attachments?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      Attachments ({row.attachments.length})
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {row.attachments.map((attachment: any, idx: number) => (
                        <a
                          key={`${attachment.storageId}-${idx}`}
                          href={attachment.url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded border bg-muted/20 p-2 hover:bg-muted/40 transition-colors"
                        >
                          {attachment.url ? (
                            <img
                              src={attachment.url}
                              alt={attachment.fileName || `attachment-${idx + 1}`}
                              className="h-24 w-full object-cover rounded mb-1"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-24 w-full rounded mb-1 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              Image unavailable
                            </div>
                          )}
                          <div className="text-[11px] truncate">{attachment.fileName || "image"}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {formatFileSize(attachment.sizeBytes) ?? "Image"}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {row.status === "open" && (
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => handleResolve(row._id)}>
                      Mark Resolved
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentsPage;
