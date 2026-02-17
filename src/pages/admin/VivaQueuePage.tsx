import { useEffect, useMemo, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CheckCircle,
  Clock,
  BookOpen,
  Filter,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { extractImageSrc, loadDiagnosticData } from "@/lib/diagnostic";
import { MathText } from "@/components/math/MathText";
import { cn } from "@/lib/utils";

interface QueueUser {
  _id?: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  batch?: string;
}

interface QueueAttempt {
  _id?: string;
  userId?: string;
  diagnosticModuleName?: string;
  passed?: boolean;
  score?: number;
  questionCount?: number;
  submittedAt?: number;
  durationMs?: number;
  studentMajorObjectiveId?: string;
  results?: Array<{
    questionId: string;
    topic?: string;
    chosenLabel?: string;
    correctLabel?: string;
    correct?: boolean;
    misconception?: string;
    explanation?: string;
    visualHtml?: string;
    stem?: string;
  }>;
}

interface QueueRow {
  attemptId?: string;
  attempt?: QueueAttempt;
  user?: QueueUser;
  majorObjective?: { title?: string; curriculum?: string };
  majorAssignment?: { status?: string };
  domain?: { name?: string };
}

interface VivaRequestRow {
  _id: string;
  userId?: string;
  user?: QueueUser;
  objective?: { title?: string; difficulty?: string };
  domain?: { name?: string };
  vivaRequestedAt?: number;
}

interface UnlockRequestRow {
  _id: string;
  user?: QueueUser;
  majorObjective?: { title?: string; curriculum?: string };
  majorObjectiveId?: string;
  domain?: { name?: string };
  requestedAt: number;
}

/**
 * Viva Queue Page
 * Review and approve student mastery claims
 */
export function VivaQueuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const vivaRequests = useQuery(api.objectives.getVivaRequests) as
    | VivaRequestRow[]
    | undefined;
  const updateStatus = useMutation(api.objectives.updateStatus);
  const pendingUnlockRequests = useQuery(api.diagnostics.getPendingUnlockRequests) as
    | UnlockRequestRow[]
    | undefined;
  const diagnosticFailures = useQuery(api.diagnostics.getFailuresForQueue) as
    | QueueRow[]
    | undefined;
  const diagnosticAttempts = useQuery(api.diagnostics.getAllAttemptsForAdmin) as
    | QueueRow[]
    | undefined;
  const approveUnlock = useMutation(api.diagnostics.approveUnlock);
  const denyUnlock = useMutation(api.diagnostics.denyUnlock);

  // Dialog state for confirmations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "approve" | "reject";
    request: VivaRequestRow | null;
  }>({ isOpen: false, type: "approve", request: null });
  const [failureDialog, setFailureDialog] = useState<{
    isOpen: boolean;
    attemptId: string | null;
  }>({ isOpen: false, attemptId: null });
  const [studentFilter, setStudentFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [passFilter, setPassFilter] = useState<"all" | "passed" | "failed">("all");
  const [batchFilter, setBatchFilter] = useState<"all" | "2153" | "2156">("all");
  const [insightsTab, setInsightsTab] = useState<"failures" | "attempts">("failures");
  const [questionChoiceTextById, setQuestionChoiceTextById] = useState<Record<string, Record<string, string>>>({});
  const resultsScrollRef = useRef<HTMLDivElement | null>(null);

  const failureDetails = useQuery(
    api.diagnostics.getAttemptDetails,
    failureDialog.attemptId ? { attemptId: failureDialog.attemptId as any } : "skip"
  ) as
    | {
        attempt: QueueAttempt;
        user?: QueueUser;
        majorObjective?: { title?: string };
        domain?: { name?: string };
      }
    | null
    | undefined;

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
      .catch(() => {
        // Keep fallback behavior: review still works with labels even if bank lookup fails.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!failureDialog.isOpen) return;
    if (resultsScrollRef.current) {
      resultsScrollRef.current.scrollTop = 0;
    }
  }, [failureDialog.isOpen, failureDialog.attemptId]);

  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of diagnosticAttempts ?? []) {
      const name = row?.attempt?.diagnosticModuleName;
      if (name) set.add(name);
    }
    return Array.from(set).sort();
  }, [diagnosticAttempts]);

  const byStudent = studentFilter.trim().toLowerCase();
  const matchesStudent = (rowUser: QueueUser | undefined) => {
    if (!byStudent) return true;
    const haystack = `${rowUser?.displayName ?? ""} ${rowUser?.username ?? ""}`.toLowerCase();
    return haystack.includes(byStudent);
  };

  const matchesBatch = (rowUser: QueueUser | undefined) => {
    if (batchFilter === "all") return true;
    return rowUser?.batch === batchFilter;
  };

  const filteredAttempts = (diagnosticAttempts ?? []).filter((row) => {
    if (passFilter === "passed" && !row.attempt?.passed) return false;
    if (passFilter === "failed" && row.attempt?.passed) return false;
    if (moduleFilter !== "all" && row.attempt?.diagnosticModuleName !== moduleFilter) {
      return false;
    }
    return matchesStudent(row.user) && matchesBatch(row.user);
  });

  const filteredFailures = (diagnosticFailures ?? []).filter((row) => {
    if (moduleFilter !== "all" && row.attempt?.diagnosticModuleName !== moduleFilter) {
      return false;
    }
    return matchesStudent(row.user) && matchesBatch(row.user);
  });

  const filteredUnlockRequests = (pendingUnlockRequests ?? []).filter((row) =>
    matchesStudent(row.user) && matchesBatch(row.user)
  );

  const filteredVivaRequests = (vivaRequests ?? []).filter((row) =>
    matchesStudent(row.user) && matchesBatch(row.user)
  );

  const latestFilteredAttempts = (() => {
    const seen = new Set<string>();
    const rows: QueueRow[] = [];
    for (const row of filteredAttempts) {
      const userId =
        row.user?._id?.toString?.() ??
        row.attempt?.userId?.toString?.() ??
        "unknown";
      const moduleName = row.attempt?.diagnosticModuleName ?? "";
      const key = `${userId}-${moduleName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
    return rows;
  })();

  const attemptStudentCount = (() => {
    const uniqueStudents = new Set<string>();
    for (const row of filteredAttempts) {
      const userId =
        row.user?._id?.toString?.() ??
        row.attempt?.userId?.toString?.();
      if (userId) uniqueStudents.add(userId);
    }
    return uniqueStudents.size;
  })();

  const openConfirmDialog = (type: "approve" | "reject", request: VivaRequestRow) => {
    setConfirmDialog({ isOpen: true, type, request });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, type: "approve", request: null });
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

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
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

  const clearFilters = () => {
    setStudentFilter("");
    setModuleFilter("all");
    setPassFilter("all");
    setBatchFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Viva Queue</h1>
          <p className="text-muted-foreground">
            Clear urgent decisions first, then review attempt evidence.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          <Clock className="mr-1 h-3.5 w-3.5" />
          Live Queue
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Global Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              type="text"
              placeholder="Search student name or username"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="md:col-span-1"
            />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All modules</option>
              {moduleOptions.map((moduleName) => (
                <option key={moduleName} value={moduleName}>
                  {moduleName}
                </option>
              ))}
            </select>
            <select
              value={passFilter}
              onChange={(e) => setPassFilter(e.target.value as "all" | "passed" | "failed")}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All outcomes</option>
              <option value="passed">Passed only</option>
              <option value="failed">Failed only</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Batch</span>
            <div className="inline-flex items-center rounded-md border bg-background p-1">
              <Button
                type="button"
                size="sm"
                variant={batchFilter === "all" ? "default" : "ghost"}
                className="h-7 px-3"
                onClick={() => setBatchFilter("all")}
              >
                All
              </Button>
              <Button
                type="button"
                size="sm"
                variant={batchFilter === "2153" ? "default" : "ghost"}
                className="h-7 px-3"
                onClick={() => setBatchFilter("2153")}
              >
                2153
              </Button>
              <Button
                type="button"
                size="sm"
                variant={batchFilter === "2156" ? "default" : "ghost"}
                className="h-7 px-3"
                onClick={() => setBatchFilter("2156")}
              >
                2156
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {batchFilter === "all" ? "All batches" : `Batch ${batchFilter} only`} •{" "}
              {filteredUnlockRequests.length} unlocks • {filteredVivaRequests.length} viva
              requests • {filteredFailures.length} failures • {latestFilteredAttempts.length} latest
              attempts ({filteredAttempts.length} submissions, {attemptStudentCount} students)
            </span>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unlock Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUnlockRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Vivas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{filteredVivaRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for decision
            </p>
          </CardContent>
        </Card>

        <button
          type="button"
          className="text-left"
          onClick={() => setInsightsTab("failures")}
        >
          <Card className="cursor-pointer hover:bg-accent/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Failures</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{filteredFailures.length}</div>
              <p className="text-xs text-muted-foreground">
                Click to open failures
              </p>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          className="text-left"
          onClick={() => setInsightsTab("attempts")}
        >
          <Card className="cursor-pointer hover:bg-accent/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attempts</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestFilteredAttempts.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredAttempts.length} submissions • {attemptStudentCount} students
              </p>
            </CardContent>
          </Card>
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Immediate Action</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Approve unlocks and viva requests first. Use Insights for deeper diagnostic review.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Diagnostic Unlock Requests</h2>
          <p className="text-sm text-muted-foreground">
            Approve a 24-hour, 1-attempt diagnostic window for students.
          </p>
        </div>

        {filteredUnlockRequests.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredUnlockRequests.map((req) => (
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm">
              <ShieldCheck className="h-5 w-5 text-muted-foreground/70" />
            </div>
            <p className="text-sm font-medium text-foreground">No pending unlock requests</p>
            <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">
              Students will appear here when they request a diagnostic.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Pending Viva Requests</h2>
          <p className="text-sm text-muted-foreground">
            Students ready to demonstrate mastery of their learning objectives.
          </p>
        </div>

        {filteredVivaRequests.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredVivaRequests.map((request) => (
              <div
                key={request._id}
                className="group rounded-xl border bg-card shadow-sm p-5 hover:bg-accent/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/students/${request.userId}`)}
                onKeyDown={(e) => {
                  if (!request.userId) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/admin/students/${request.userId}`);
                  }
                }}
                role="button"
                tabIndex={0}
                title="View student details"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.user?.avatarUrl} alt={request.user?.displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {request.user?.displayName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{request.user?.displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">@{request.user?.username}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {request.vivaRequestedAt ? formatDate(request.vivaRequestedAt) : "Unknown"}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="font-medium text-sm truncate">{request.objective?.title}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{request.domain?.name}</Badge>
                    <Badge variant="secondary">{request.objective?.difficulty}</Badge>
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm">
              <Inbox className="h-5 w-5 text-muted-foreground/70" />
            </div>
            <p className="text-sm font-medium text-foreground">Viva queue clear</p>
            <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">
              No students are currently awaiting mastery reviews.
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Insights & Review</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={insightsTab}
            onValueChange={(value) => setInsightsTab(value as "failures" | "attempts")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="failures">Failures ({filteredFailures.length})</TabsTrigger>
              <TabsTrigger value="attempts">Attempts ({latestFilteredAttempts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="failures" className="mt-4">
              {filteredFailures.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredFailures.map((row) => (
                    <div key={row.attemptId ?? `${row.user?._id ?? "unknown"}-failure`} className="rounded-xl border bg-card shadow-sm p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={row.user?.avatarUrl} alt={row.user?.displayName} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {row.user?.displayName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{row.user?.displayName}</p>
                          <p className="text-sm text-muted-foreground truncate">@{row.user?.username}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(row.attempt?.submittedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="font-medium text-sm truncate">
                          {row.majorObjective?.title || row.attempt?.diagnosticModuleName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        {row.domain?.name && <Badge variant="outline">{row.domain.name}</Badge>}
                        <Badge variant="destructive">
                          {row.attempt?.score}/{row.attempt?.questionCount}
                        </Badge>
                        <Badge variant={row.majorAssignment?.status === "viva_requested" ? "default" : "secondary"}>
                          {row.majorAssignment?.status === "viva_requested" ? "Viva Requested" : "Needs Viva"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/students/${row.attempt?.userId}`)}
                          disabled={!row.attempt?.userId}
                        >
                          Open Student
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => row.attemptId && openFailureDialog(row.attemptId)}
                          disabled={!row.attemptId}
                        >
                          Review Attempt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No unresolved failures for current filters.</p>
              )}
            </TabsContent>

            <TabsContent value="attempts" className="mt-4">
              {latestFilteredAttempts.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {latestFilteredAttempts.map((row) => (
                    <div
                      key={row.attemptId ?? `${row.user?._id ?? "unknown"}-attempt`}
                      className="group rounded-xl border bg-card shadow-sm p-5 hover:bg-accent/40 transition-colors cursor-pointer"
                      onClick={() => row.attemptId && openFailureDialog(row.attemptId)}
                      onKeyDown={(e) => {
                        if (!row.attemptId) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openFailureDialog(row.attemptId);
                        }
                      }}
                      role="button"
                      tabIndex={0}
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
                          <p className="text-sm text-muted-foreground truncate">@{row.user?.username}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(row.attempt?.submittedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="font-medium text-sm truncate">{row.majorObjective?.title}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {row.domain?.name && <Badge variant="outline">{row.domain.name}</Badge>}
                          <Badge variant={row.attempt?.passed ? "default" : "secondary"}>
                            {row.attempt?.score ?? 0}/{row.attempt?.questionCount ?? 0}
                          </Badge>
                          <Badge variant={row.attempt?.passed ? "default" : "destructive"}>
                            {row.attempt?.passed ? "PASS" : "FAIL"}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(((row.attempt?.durationMs || 0) / 1000))}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attempts match current filters.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Diagnostic Failure Dialog */}
      <Dialog open={failureDialog.isOpen} onOpenChange={(open) => !open && closeFailureDialog()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Diagnostic Attempt Review</DialogTitle>
            <DialogDescription>
              Review full question-level evidence and decide whether to approve mastery.
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

              <div ref={resultsScrollRef} className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {(failureDetails.attempt.results ?? []).map((r, idx: number) => {
                    const img = extractImageSrc(r.visualHtml);
                    const choiceTextByLabel = questionChoiceTextById[r.questionId] ?? {};
                    const chosenText = r.chosenLabel ? choiceTextByLabel[r.chosenLabel] : "";
                    const correctText = r.correctLabel ? choiceTextByLabel[r.correctLabel] : "";
                    return (
                      <div
                        key={`${r.questionId}-${idx}`}
                        className={cn(
                          "rounded-lg border p-4",
                          r.correct
                            ? "bg-card"
                            : "border-destructive/30 bg-destructive/5"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="font-medium text-sm whitespace-pre-wrap">
                            <div className="text-xs text-muted-foreground mb-1">
                              Question {idx + 1} of {failureDetails.attempt.results.length}
                            </div>
                            {r.stem ? <MathText text={r.stem} /> : r.topic}
                          </div>
                          <Badge variant={r.correct ? "default" : "destructive"}>
                            {r.correct ? "Correct" : "Incorrect"}
                          </Badge>
                        </div>

                        {r.stem && (
                          <div className="text-xs text-muted-foreground mb-2">
                            {r.topic}
                          </div>
                        )}

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

                        <div
                          className={cn(
                            "text-sm text-muted-foreground space-y-1",
                            !r.correct && "rounded-md border border-destructive/20 bg-destructive/5 p-2"
                          )}
                        >
                          {r.correct ? (
                            <div className="whitespace-pre-wrap">
                              <span className="font-medium text-foreground">Answer:</span>{" "}
                              <span className="font-medium">{r.correctLabel}</span>
                              {correctText ? (
                                <>
                                  {" "}• <MathText text={correctText} />
                                </>
                              ) : null}
                            </div>
                          ) : (
                            <>
                              <div className="whitespace-pre-wrap">
                                <span className="font-medium text-foreground">Student picked:</span>{" "}
                                <span className="font-medium">{r.chosenLabel}</span>
                                {chosenText ? (
                                  <>
                                    {" "}• <MathText text={chosenText} />
                                  </>
                                ) : null}
                              </div>
                              <div className="whitespace-pre-wrap">
                                <span className="font-medium text-foreground">Correct answer:</span>{" "}
                                <span className="font-medium">{r.correctLabel}</span>
                                {correctText ? (
                                  <>
                                    {" "}• <MathText text={correctText} />
                                  </>
                                ) : null}
                              </div>
                            </>
                          )}
                        </div>

                        {r.misconception && (
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            <span className="font-medium text-foreground">Misconception:</span>{" "}
                            <MathText text={r.misconception} />
                          </div>
                        )}
                        {r.explanation && (
                          <div className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                            <span className="font-medium text-foreground">Explanation:</span>{" "}
                            <MathText text={r.explanation} />
                          </div>
                        )}
                      </div>
                    );
                  })}

                {failureDetails.attempt.results.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No question results recorded for this attempt.
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
