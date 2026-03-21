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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MathText } from "@/components/math/MathText";
import { extractImageSrc, loadDiagnosticData } from "@/lib/diagnostic";

type QueueTab = "retakes" | "failures" | "history";

export function DiagnosticsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<QueueTab>("retakes");
  const [search, setSearch] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [questionChoiceTextById, setQuestionChoiceTextById] = useState<Record<string, Record<string, string>>>({});

  const pendingUnlockRequests = useQuery(api.diagnostics.getPendingUnlockRequests) as any[] | undefined;
  const failures = useQuery(api.diagnostics.getFailuresForQueue) as any[] | undefined;
  const attempts = useQuery(api.diagnostics.getAllAttemptsForAdmin) as any[] | undefined;
  const selectedAttempt = useQuery(
    api.diagnostics.getAttemptDetails,
    selectedAttemptId ? { attemptId: selectedAttemptId as any } : "skip"
  ) as any;

  const approveUnlock = useMutation(api.diagnostics.approveUnlock);
  const denyUnlock = useMutation(api.diagnostics.denyUnlock);

  useEffect(() => {
    let cancelled = false;
    loadDiagnosticData()
      .then((modules) => {
        if (cancelled) return;
        const nextMap: Record<string, Record<string, string>> = {};
        for (const module of modules ?? []) {
          for (const question of module.questions ?? []) {
            const byLabel: Record<string, string> = {};
            for (const choice of question.choices ?? []) {
              byLabel[choice.label] = choice.text ?? "";
            }
            nextMap[question.id] = byLabel;
          }
        }
        setQuestionChoiceTextById(nextMap);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const term = search.trim().toLowerCase();
  const matches = (rowUser: any, title?: string) => {
    if (!term) return true;
    const haystack = `${rowUser?.displayName ?? ""} ${rowUser?.username ?? ""} ${title ?? ""}`.toLowerCase();
    return haystack.includes(term);
  };

  const filteredRequests = useMemo(
    () =>
      (pendingUnlockRequests ?? []).filter((row) =>
        matches(row.user, row.majorObjective?.title || row.majorObjectiveId)
      ),
    [pendingUnlockRequests, term]
  );
  const filteredFailures = useMemo(
    () =>
      (failures ?? []).filter((row) => matches(row.user, row.majorObjective?.title || row.attempt?.diagnosticModuleName)),
    [failures, term]
  );
  const filteredAttempts = useMemo(
    () =>
      (attempts ?? []).filter((row) => matches(row.user, row.majorObjective?.title || row.attempt?.diagnosticModuleName)),
    [attempts, term]
  );

  useEffect(() => {
    if (tab === "retakes") {
      setSelectedRequestId((current) =>
        current && filteredRequests.some((row) => row._id === current)
          ? current
          : filteredRequests[0]?._id ?? null
      );
    } else {
      setSelectedAttemptId((current) =>
        current && (filteredFailures.some((row) => row.attemptId === current) || filteredAttempts.some((row) => row.attemptId === current))
          ? current
          : (tab === "failures" ? filteredFailures[0]?.attemptId : filteredAttempts[0]?.attemptId) ?? null
      );
    }
  }, [filteredAttempts, filteredFailures, filteredRequests, tab]);

  const selectedRequest = filteredRequests.find((row) => row._id === selectedRequestId) ?? null;

  const handleApprove = async () => {
    if (!selectedRequest || !user?._id) return;
    try {
      await approveUnlock({
        requestId: selectedRequest._id as any,
        approvedBy: user._id as any,
        expiresInMinutes: 1440,
        attemptsGranted: 1,
      });
      setDecisionNotes("");
      toast.success("Retake approved.");
    } catch (err: any) {
      toast.error(err?.message || "Could not approve retake.");
    }
  };

  const handleDeny = async () => {
    if (!selectedRequest || !user?._id) return;
    const trimmed = decisionNotes.trim();
    if (!trimmed) {
      toast.error("Add a note before denying a retake.");
      return;
    }
    try {
      await denyUnlock({
        requestId: selectedRequest._id as any,
        deniedBy: user._id as any,
        decisionNotes: trimmed,
      });
      setDecisionNotes("");
      toast.success("Retake denied.");
    } catch (err: any) {
      toast.error(err?.message || "Could not deny retake.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8178]">
            Diagnostics
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#1f1a17]">Retakes and attempt review</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c655c]">
            Approve retakes here, review misses with full question evidence, and keep viva decisions
            out of this workspace.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retake requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-[#1f1a17]">{filteredRequests.length}</div>
          </CardContent>
        </Card>
        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active failures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-[#1f1a17]">{filteredFailures.length}</div>
          </CardContent>
        </Card>
        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attempt history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-[#1f1a17]">{filteredAttempts.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader className="space-y-3">
            <CardTitle className="font-serif text-xl">Queue</CardTitle>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or objective"
              className="border-black/10 bg-white"
            />
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(value) => setTab(value as QueueTab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="retakes">Retakes</TabsTrigger>
                <TabsTrigger value="failures">Failures</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="retakes" className="mt-4 space-y-3">
                {filteredRequests.map((row) => (
                  <button
                    key={row._id}
                    type="button"
                    onClick={() => setSelectedRequestId(row._id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left ${
                      row._id === selectedRequestId
                        ? "border-[#1f1a17]/20 bg-[#f7f1e8]"
                        : "border-black/10 bg-[#fcfaf6]"
                    }`}
                  >
                    <p className="font-medium text-[#1f1a17]">{row.user?.displayName}</p>
                    <p className="truncate text-sm text-[#4d453d]">{row.majorObjective?.title || row.majorObjectiveId}</p>
                    <p className="text-xs text-[#6c655c]">{row.domain?.name}</p>
                  </button>
                ))}
              </TabsContent>
              <TabsContent value="failures" className="mt-4 space-y-3">
                {filteredFailures.map((row) => (
                  <button
                    key={row.attemptId}
                    type="button"
                    onClick={() => setSelectedAttemptId(row.attemptId)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left ${
                      row.attemptId === selectedAttemptId
                        ? "border-[#1f1a17]/20 bg-[#f7f1e8]"
                        : "border-black/10 bg-[#fcfaf6]"
                    }`}
                  >
                    <p className="font-medium text-[#1f1a17]">{row.user?.displayName}</p>
                    <p className="truncate text-sm text-[#4d453d]">{row.majorObjective?.title}</p>
                    <p className="text-xs text-[#6c655c]">
                      {row.attempt?.score}/{row.attempt?.questionCount}
                    </p>
                  </button>
                ))}
              </TabsContent>
              <TabsContent value="history" className="mt-4 space-y-3">
                {filteredAttempts.map((row) => (
                  <button
                    key={row.attemptId}
                    type="button"
                    onClick={() => setSelectedAttemptId(row.attemptId)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left ${
                      row.attemptId === selectedAttemptId
                        ? "border-[#1f1a17]/20 bg-[#f7f1e8]"
                        : "border-black/10 bg-[#fcfaf6]"
                    }`}
                  >
                    <p className="font-medium text-[#1f1a17]">{row.user?.displayName}</p>
                    <p className="truncate text-sm text-[#4d453d]">{row.majorObjective?.title}</p>
                    <p className="text-xs text-[#6c655c]">
                      {row.attempt?.passed ? "Passed" : "Not passed"} • {row.attempt?.score}/{row.attempt?.questionCount}
                    </p>
                  </button>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {tab === "retakes" ? (
            selectedRequest ? (
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <Card className="border-black/10 bg-white/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Retake request</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={selectedRequest.user?.avatarUrl} alt={selectedRequest.user?.displayName} />
                        <AvatarFallback>{selectedRequest.user?.displayName?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-[#1f1a17]">{selectedRequest.user?.displayName}</p>
                        <p className="text-sm text-[#6c655c]">@{selectedRequest.user?.username}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-[#faf7f2] p-4 text-sm text-[#4d453d]">
                      <p className="font-medium text-[#1f1a17]">{selectedRequest.majorObjective?.title}</p>
                      <p className="mt-1">{selectedRequest.domain?.name}</p>
                      <p className="mt-2 text-xs text-[#6c655c]">
                        Requested {new Date(selectedRequest.requestedAt).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-black/10 bg-white/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Decision</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Add guidance if you are denying this retake."
                      className="min-h-[160px] border-black/10 bg-white"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button onClick={handleApprove}>Approve retake</Button>
                      <Button variant="outline" onClick={handleDeny}>
                        Deny retake
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-black/10 bg-white/80 shadow-none">
                <CardContent className="flex min-h-[320px] items-center justify-center text-sm text-[#6c655c]">
                  No retake request selected.
                </CardContent>
              </Card>
            )
          ) : selectedAttempt ? (
            <Card className="border-black/10 bg-white/80 shadow-none">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Attempt details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedAttempt ? null : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#1f1a17]">
                          {selectedAttempt.user?.displayName} • {selectedAttempt.majorObjective?.title}
                        </p>
                        <p className="text-sm text-[#6c655c]">
                          {selectedAttempt.domain?.name} • {selectedAttempt.attempt?.diagnosticModuleName}
                        </p>
                      </div>
                      <Badge variant={selectedAttempt.attempt?.passed ? "secondary" : "destructive"}>
                        {selectedAttempt.attempt?.score}/{selectedAttempt.attempt?.questionCount}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {(selectedAttempt.attempt?.results ?? []).map((row: any, index: number) => {
                        const img = extractImageSrc(row.visualHtml);
                        const byLabel = questionChoiceTextById[row.questionId] ?? {};
                        return (
                          <div
                            key={`${row.questionId}-${index}`}
                            className={`rounded-2xl border p-4 ${
                              row.correct
                                ? "border-black/10 bg-[#faf7f2]"
                                : "border-red-200 bg-red-50/80"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm font-medium text-[#1f1a17]">
                                {row.stem ? <MathText text={row.stem} /> : row.topic}
                              </p>
                              <Badge variant={row.correct ? "secondary" : "destructive"}>
                                {row.correct ? "Correct" : "Incorrect"}
                              </Badge>
                            </div>
                            {img ? (
                              <div className="mt-3 rounded-xl bg-white/80 p-3">
                                <img src={img} alt="Diagnostic question" className="max-w-full rounded-lg" />
                              </div>
                            ) : null}
                            <div className="mt-3 space-y-1 text-sm text-[#4d453d]">
                              <p>
                                Student picked: <span className="font-medium">{row.chosenLabel}</span>
                                {byLabel[row.chosenLabel] ? ` • ${byLabel[row.chosenLabel]}` : ""}
                              </p>
                              <p>
                                Correct answer: <span className="font-medium">{row.correctLabel}</span>
                                {byLabel[row.correctLabel] ? ` • ${byLabel[row.correctLabel]}` : ""}
                              </p>
                              {row.misconception ? <p>Misconception: {row.misconception}</p> : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-black/10 bg-white/80 shadow-none">
              <CardContent className="flex min-h-[320px] items-center justify-center text-sm text-[#6c655c]">
                Select an attempt to review the question-level evidence.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiagnosticsPage;
