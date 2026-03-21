import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MasteryStatusCard } from "@/components/mastery/MasteryStatusCard";

export function VivaQueuePage() {
  const { user } = useAuth();
  const vivaQueue = useQuery(api.mastery.getAdminVivaQueue) as any[] | undefined;
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const decideViva = useMutation(api.mastery.decideViva);

  const filteredQueue = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (vivaQueue ?? []).filter((row) => {
      if (!term) return true;
      const haystack = `${row.user?.displayName ?? ""} ${row.user?.username ?? ""} ${row.objective?.title ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [search, vivaQueue]);

  useEffect(() => {
    if (!filteredQueue.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) =>
      current && filteredQueue.some((row) => row._id === current) ? current : filteredQueue[0]._id
    );
  }, [filteredQueue]);

  const selectedRow = filteredQueue.find((row) => row._id === selectedId) ?? null;
  const selectedState = useQuery(
    api.mastery.getMajorMasteryState,
    selectedRow
      ? {
          userId: selectedRow.userId as any,
          majorObjectiveId: selectedRow.objective?._id as any,
        }
      : "skip"
  );

  const handleDecision = async (decision: "mastered" | "not_ready") => {
    if (!user?._id || !selectedRow) return;
    const trimmed = decisionNotes.trim();
    if (!trimmed) {
      toast.error("Add a coach note before saving this decision.");
      return;
    }

    try {
      await decideViva({
        studentMajorObjectiveId: selectedRow._id as any,
        decision,
        decidedBy: user._id as any,
        decisionNotes: trimmed,
      });
      toast.success(decision === "mastered" ? "Marked mastered." : "Sent back with notes.");
      setDecisionNotes("");
    } catch (err: any) {
      toast.error(err?.message || "Could not save viva decision.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8178]">
            Viva
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#1f1a17]">Coach mastery decisions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c655c]">
            This page is only for real viva requests. Retake approvals and attempt review now live
            in Diagnostics.
          </p>
        </div>
        <Badge variant="outline" className="border-black/10 bg-white/70 px-3 py-1.5 text-[#5f5a53]">
          {filteredQueue.length} pending
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending vivas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-[#1f1a17]">{filteredQueue.length}</div>
            <p className="mt-1 text-xs text-[#6c655c]">Requests waiting on coach judgment</p>
          </CardContent>
        </Card>
        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Focus rule</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-[#4d453d]">
            Decide mastery here. Do not approve retakes on this page.
          </CardContent>
        </Card>
        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Decision quality</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-[#4d453d]">
            Every “needs more work” decision requires a note so the student sees a clear reason.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader className="space-y-3">
            <CardTitle className="font-serif text-xl">Pending requests</CardTitle>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or objective"
              className="border-black/10 bg-white"
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredQueue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-[#faf7f2] px-4 py-10 text-center text-sm text-[#6c655c]">
                No viva requests are waiting right now.
              </div>
            ) : (
              filteredQueue.map((row) => {
                const isActive = row._id === selectedId;
                return (
                  <button
                    key={row._id}
                    type="button"
                    onClick={() => setSelectedId(row._id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                      isActive
                        ? "border-[#1f1a17]/20 bg-[#f7f1e8]"
                        : "border-black/10 bg-[#fcfaf6] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={row.user?.avatarUrl} alt={row.user?.displayName} />
                        <AvatarFallback>{row.user?.displayName?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#1f1a17]">{row.user?.displayName}</p>
                        <p className="truncate text-xs text-[#6c655c]">@{row.user?.username}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="truncate text-sm font-medium text-[#1f1a17]">{row.objective?.title}</p>
                      <p className="text-xs text-[#6c655c]">
                        {row.domain?.name} • {row.readiness.completedSubObjectives}/{row.readiness.totalSubObjectives} complete
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!selectedRow || !selectedState ? (
            <Card className="border-black/10 bg-white/80 shadow-none">
              <CardContent className="flex min-h-[360px] items-center justify-center text-sm text-[#6c655c]">
                Select a viva request to review the full case.
              </CardContent>
            </Card>
          ) : (
            <>
              <MasteryStatusCard state={selectedState as any} variant="full" />

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <Card className="border-black/10 bg-white/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Student request</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-[#4d453d]">
                    {selectedRow.vivaRequestNotes ? (
                      <div className="rounded-2xl border border-black/10 bg-[#faf7f2] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8178]">
                          Student note
                        </p>
                        <p className="mt-2 whitespace-pre-wrap">{selectedRow.vivaRequestNotes}</p>
                      </div>
                    ) : (
                      <p className="text-[#6c655c]">No student note was attached to this request.</p>
                    )}
                    {selectedRow.latestAttempt ? (
                      <div className="rounded-2xl border border-black/10 bg-[#faf7f2] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8178]">
                          Latest diagnostic
                        </p>
                        <p className="mt-2 font-medium text-[#1f1a17]">
                          {selectedRow.latestAttempt.score}/{selectedRow.latestAttempt.questionCount} •{" "}
                          {selectedRow.latestAttempt.passed ? "Passed" : "Not passed"}
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="border-black/10 bg-white/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Coach decision</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="What should the student understand about this decision?"
                      className="min-h-[160px] border-black/10 bg-white"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button onClick={() => handleDecision("mastered")}>Mark mastered</Button>
                      <Button variant="outline" onClick={() => handleDecision("not_ready")}>
                        Needs more work
                      </Button>
                    </div>
                    <p className="text-xs text-[#6c655c]">
                      Both actions save the note. “Needs more work” keeps the student in progress and
                      surfaces the feedback on their mastery page.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VivaQueuePage;
