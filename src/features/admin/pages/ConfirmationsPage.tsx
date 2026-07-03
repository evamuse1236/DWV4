import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/textarea";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import {
  AllClearPanel,
  QueueEmptyList,
  QueueLayout,
  QueueListItem,
  QueueListPanel,
  SelectPrompt,
  useQueueKeyboardNav,
} from "@/features/admin/components/QueueWorkspace";

/**
 * Confirmations — students mark an assignment done, the coach checks the
 * work offline and confirms (or sends it back with a note) here.
 */
export function ConfirmationsPage() {
  const { user, token } = useAuth();
  const queue = useQuery(
    api.assignments.getConfirmationQueue,
    token ? { adminToken: token } : "skip"
  ) as any[] | undefined;
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const approveWork = useMutation(api.assignments.approveWork);
  const rejectWork = useMutation(api.assignments.rejectWork);

  const filteredQueue = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (queue ?? []).filter((row) => {
      if (!term) return true;
      const haystack =
        `${row.user?.displayName ?? ""} ${row.user?.username ?? ""} ${row.objective?.title ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [search, queue]);

  useEffect(() => {
    if (!filteredQueue.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) =>
      current && filteredQueue.some((row) => row._id === current)
        ? current
        : filteredQueue[0]._id
    );
  }, [filteredQueue]);

  const queueIds = useMemo(
    () => filteredQueue.map((row) => row._id as string),
    [filteredQueue]
  );
  const handleKeyboardSelect = useCallback((id: string) => setSelectedId(id), []);
  useQueueKeyboardNav(queueIds, selectedId, handleKeyboardSelect);

  const selectedRow = filteredQueue.find((row) => row._id === selectedId) ?? null;

  const handleDecision = async (decision: "approve" | "reject") => {
    if (!user?._id || !token || !selectedRow || submitting) return;
    const trimmed = note.trim();
    if (decision === "reject" && !trimmed) {
      toast.error("Add a note so the student knows what to fix.");
      return;
    }

    setSubmitting(true);
    try {
      if (decision === "approve") {
        await approveWork({
          adminToken: token,
          studentMajorObjectiveId: selectedRow._id as any,
          decidedBy: user._id as any,
          note: trimmed || undefined,
        });
        toast.success("Confirmed. The student will see it as complete.");
      } else {
        await rejectWork({
          adminToken: token,
          studentMajorObjectiveId: selectedRow._id as any,
          decidedBy: user._id as any,
          note: trimmed,
        });
        toast.success("Sent back with your note.");
      }
      setNote("");
    } catch (err: any) {
      toast.error(err?.message || "Could not save the decision.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPending = queue?.length ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Coach Work · Confirmations"
        title="Completed work to confirm"
        description="Students marked these assignments done. Check the work with them, then confirm or send back with a note."
        meta={
          <Badge
            variant="outline"
            className="border-black/10 bg-white/70 px-3 py-1.5 font-mono text-muted-foreground"
          >
            {totalPending} waiting
          </Badge>
        }
      />

      {totalPending === 0 ? (
        <AllClearPanel
          title="Nothing waiting on you."
          body="When a student marks an assignment done, it lands here for your confirmation."
        />
      ) : (
        <QueueLayout>
          <QueueListPanel
            title="Marked done"
            count={filteredQueue.length}
            search={search}
            onSearchChange={setSearch}
          >
            {filteredQueue.length === 0 ? (
              <QueueEmptyList label={`No matches for "${search.trim()}".`} />
            ) : (
              filteredQueue.map((row) => (
                <QueueListItem
                  key={row._id}
                  active={row._id === selectedId}
                  onClick={() => setSelectedId(row._id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={row.user?.avatarUrl} alt={row.user?.displayName} />
                      <AvatarFallback>{row.user?.displayName?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {row.user?.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{row.user?.username}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {row.objective?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.domain?.name}
                      {row.submittedAt
                        ? ` · ${new Date(row.submittedAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}`
                        : ""}
                    </p>
                  </div>
                </QueueListItem>
              ))
            )}
          </QueueListPanel>

          <div className="space-y-4">
            {!selectedRow ? (
              <SelectPrompt label="Select a submission to review it." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <Card className="border-black/10 bg-white/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">The work</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-foreground/80">
                    <div className="rounded-2xl border border-black/10 bg-muted/30 p-4">
                      <p className="font-medium text-foreground">
                        {selectedRow.objective?.title}
                      </p>
                      {selectedRow.objective?.description ? (
                        <p className="mt-1">{selectedRow.objective.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {selectedRow.domain?.name} ·{" "}
                        <span className="font-mono">
                          {selectedRow.work?.completedSubObjectives}/
                          {selectedRow.work?.totalSubObjectives}
                        </span>{" "}
                        parts finished
                        {selectedRow.submittedAt
                          ? ` · marked done ${new Date(selectedRow.submittedAt).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    {selectedRow.submittedNotes ? (
                      <div className="rounded-2xl border border-black/10 bg-muted/30 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Student note
                        </p>
                        <p className="mt-2 whitespace-pre-wrap">{selectedRow.submittedNotes}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No note from the student on this one.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-black/10 bg-white/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Your decision</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional for confirm — required when sending back."
                      className="min-h-[160px] border-black/10 bg-white"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button disabled={submitting} onClick={() => handleDecision("approve")}>
                        Confirm done
                      </Button>
                      <Button
                        variant="outline"
                        disabled={submitting}
                        onClick={() => handleDecision("reject")}
                      >
                        Send back
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Confirming completes the assignment and awards XP. Sending back reopens
                      it with your note on the student&apos;s page.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </QueueLayout>
      )}
    </div>
  );
}

export default ConfirmationsPage;
