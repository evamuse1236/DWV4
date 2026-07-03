import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDelayedLoading } from "@/shared/hooks/useDelayedLoading";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Copy,
  Heart,
  Moon,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";

const DAY_MS = 24 * 60 * 60 * 1000;

function formatToday(): string {
  return new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Parse a YYYY-MM-DD (or ISO) sprint date as local midnight. */
function parseSprintDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

interface SprintPulse {
  state: "none" | "active" | "ended" | "upcoming";
  name?: string;
  dayIndex?: number;
  totalDays?: number;
  progress?: number;
  endedDaysAgo?: number;
}

function getSprintPulse(
  sprint: { name: string; startDate: string; endDate: string } | null | undefined
): SprintPulse {
  if (!sprint) return { state: "none" };
  const start = parseSprintDate(sprint.startDate).getTime();
  const end = parseSprintDate(sprint.endDate).getTime() + DAY_MS - 1;
  const now = Date.now();
  const totalDays = Math.max(1, Math.round((end - start) / DAY_MS));
  if (now < start) return { state: "upcoming", name: sprint.name, totalDays };
  if (now > end) {
    return {
      state: "ended",
      name: sprint.name,
      totalDays,
      endedDaysAgo: Math.floor((now - end) / DAY_MS),
    };
  }
  const dayIndex = Math.min(totalDays, Math.floor((now - start) / DAY_MS) + 1);
  return {
    state: "active",
    name: sprint.name,
    dayIndex,
    totalDays,
    progress: Math.round((dayIndex / totalDays) * 100),
  };
}

function pulseTone(percent: number): string {
  if (percent >= 70) return "bg-emerald-500";
  if (percent >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

/**
 * The coach's morning console: who checked in and how they feel, who's
 * missing, how goals and habits are moving, and what needs confirming.
 */
export function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [expandedPulse, setExpandedPulse] = useState(false);

  const adminArgs = token ? { adminToken: token } : "skip";
  const students = useQuery(api.users.getAll, adminArgs);
  const activeSprint = useQuery(api.sprints.getActive);
  const confirmations = useQuery(api.assignments.getConfirmationQueue, adminArgs) as
    | any[]
    | undefined;
  const todayCheckIns = useQuery(api.emotions.getTodayCheckIns, adminArgs) as
    | any[]
    | undefined;
  const objectives = useQuery(api.objectives.getAll, adminArgs);
  const insights = useQuery(
    api.sprints.getStudentInsights,
    token && activeSprint?._id
      ? { adminToken: token, sprintId: activeSprint._id }
      : "skip"
  ) as any;

  const setupDataLoaded =
    students !== undefined && activeSprint !== undefined && objectives !== undefined;
  const setupChecklist = {
    hasStudents: (students?.length ?? 0) > 0,
    hasActiveSprint: activeSprint !== null && activeSprint !== undefined,
    hasObjectives: (objectives?.length ?? 0) > 0,
  };
  const needsSetup =
    setupDataLoaded &&
    (!setupChecklist.hasStudents ||
      !setupChecklist.hasActiveSprint ||
      !setupChecklist.hasObjectives);

  const isLoading =
    students === undefined ||
    activeSprint === undefined ||
    confirmations === undefined ||
    todayCheckIns === undefined;

  const showSkeleton = useDelayedLoading(isLoading);

  const checkInByUserId = useMemo(() => {
    const map = new Map<string, any>();
    for (const checkIn of todayCheckIns ?? []) {
      map.set(String(checkIn.userId), checkIn);
    }
    return map;
  }, [todayCheckIns]);

  const missingStudents = useMemo(
    () =>
      (students ?? []).filter(
        (student: any) => !checkInByUserId.has(String(student._id))
      ),
    [students, checkInByUserId]
  );

  const quietStudents = useMemo(() => {
    const cutoff = Date.now() - 7 * DAY_MS;
    return (students ?? []).filter(
      (student: any) => !student.lastLoginAt || student.lastLoginAt < cutoff
    );
  }, [students]);

  const sprintPulse = useMemo(() => getSprintPulse(activeSprint), [activeSprint]);

  const pulseRows = useMemo(() => {
    const rows = insights?.students ?? [];
    return expandedPulse ? rows : rows.slice(0, 8);
  }, [insights, expandedPulse]);

  const handleCopyMissing = async () => {
    const names = missingStudents.map((s: any) => s.displayName).join(", ");
    try {
      await navigator.clipboard.writeText(names);
      toast.success("Names copied — go nudge them.");
    } catch {
      toast.error("Could not copy the list.");
    }
  };

  if (showSkeleton) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <Skeleton className="h-[480px] rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return null;

  const triageCards = [
    {
      label: "To confirm",
      value: confirmations?.length ?? 0,
      hint:
        (confirmations?.length ?? 0) === 0
          ? "No completed work waiting"
          : "Completed work waiting on you",
      icon: CheckCircle,
      path: "/admin/confirmations",
      emphasize: (confirmations?.length ?? 0) > 0,
    },
    {
      label: "Checked in",
      value: `${(todayCheckIns ?? []).length}/${students?.length ?? 0}`,
      hint:
        missingStudents.length === 0
          ? "Everyone has checked in"
          : `${missingStudents.length} still to check in`,
      icon: Heart,
      path: "/admin/students",
      emphasize: false,
    },
    {
      label: "Quiet this week",
      value: quietStudents.length,
      hint:
        quietStudents.length === 0
          ? "Everyone has been active"
          : "No activity in 7+ days",
      icon: Moon,
      path: "/admin/students",
      emphasize: false,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={formatToday()}
        title={`Good day, ${user?.displayName?.split(" ")[0] || "Coach"}`}
        description="How the class is feeling, how the work is moving, and what needs your confirmation."
      />

      {needsSetup ? (
        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Getting started
            </CardTitle>
            <CardDescription>
              Finish the essentials so the coaching workflow can run cleanly.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <button
              type="button"
              onClick={() => navigate("/admin/students")}
              className="rounded-2xl border bg-background/80 px-4 py-4 text-left transition-colors hover:bg-background"
            >
              <p className="font-medium text-foreground">Add students</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {setupChecklist.hasStudents
                  ? `${students?.length ?? 0} enrolled`
                  : "Create learner accounts"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/sprints")}
              className="rounded-2xl border bg-background/80 px-4 py-4 text-left transition-colors hover:bg-background"
            >
              <p className="font-medium text-foreground">Create a sprint</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {setupChecklist.hasActiveSprint
                  ? activeSprint?.name
                  : "Set the active learning cycle"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/objectives")}
              className="rounded-2xl border bg-background/80 px-4 py-4 text-left transition-colors hover:bg-background"
            >
              <p className="font-medium text-foreground">Add assignments</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {setupChecklist.hasObjectives
                  ? `${objectives?.length ?? 0} created`
                  : "Define what students will work on"}
              </p>
            </button>
          </CardContent>
        </Card>
      ) : null}

      {/* Triage strip */}
      <div className="grid gap-4 md:grid-cols-3">
        {triageCards.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.path)}
            className={`group rounded-2xl border px-5 py-4 text-left shadow-none transition-all hover:-translate-y-0.5 hover:shadow-sm ${
              item.emphasize
                ? "border-primary/40 bg-primary/5"
                : "border-black/10 bg-white/80"
            }`}
            data-slot="stat"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 font-mono text-4xl font-medium leading-none text-foreground">
                  {item.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{item.hint}</p>
              </div>
              <item.icon className="mt-1 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="space-y-6">
          {/* Check-in wall */}
          <Card className="border-black/10 bg-white/80 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-2xl">This morning&apos;s moods</CardTitle>
                  <CardDescription>
                    One tile per student — colour is how they said they feel.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono">
                  {(todayCheckIns ?? []).length}/{students?.length ?? 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-3">
                {(students ?? []).map((student: any) => {
                  const checkIn = checkInByUserId.get(String(student._id));
                  const moodColor = checkIn?.category?.color;
                  return (
                    <button
                      key={student._id}
                      type="button"
                      onClick={() => navigate(`/admin/students/${student._id}`)}
                      title={
                        checkIn
                          ? `${student.displayName} — ${checkIn.category?.name}${
                              checkIn.subcategory ? ` (${checkIn.subcategory.name})` : ""
                            }`
                          : `${student.displayName} — not checked in yet`
                      }
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                        checkIn
                          ? "border-transparent"
                          : "border-dashed border-border bg-muted/20 opacity-70"
                      }`}
                      style={
                        checkIn && moodColor
                          ? { backgroundColor: `${moodColor}26`, borderColor: `${moodColor}66` }
                          : undefined
                      }
                    >
                      <div className="relative">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={student.avatarUrl} alt={student.displayName} />
                          <AvatarFallback>
                            {student.displayName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {checkIn && (
                          <span className="absolute -bottom-1 -right-1 rounded-full bg-white/90 px-0.5 text-sm leading-none">
                            {checkIn.category?.emoji ?? "🙂"}
                          </span>
                        )}
                      </div>
                      <span className="max-w-full truncate text-xs font-medium text-foreground">
                        {student.displayName?.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {missingStudents.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Not checked in:</span>{" "}
                    {missingStudents.map((s: any) => s.displayName).join(", ")}
                  </p>
                  <Button variant="outline" size="sm" onClick={handleCopyMissing}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy names
                  </Button>
                </div>
              )}
              {missingStudents.length === 0 && (students?.length ?? 0) > 0 && (
                <div className="flex items-center gap-2 rounded-2xl bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Everyone has checked in today.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals & habits pulse */}
          <Card className="border-black/10 bg-white/80 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-2xl">Goals &amp; habits pulse</CardTitle>
                  <CardDescription>
                    {insights?.sprint
                      ? `${insights.sprint.name} · day ${insights.sprint.elapsedDays} of ${insights.sprint.totalDays}`
                      : "Progress across the active sprint."}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/sprints")}>
                  Details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {insights === undefined && activeSprint ? (
                <p className="py-4 text-sm text-muted-foreground">Reading the sprint…</p>
              ) : !insights || (insights.students ?? []).length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  No sprint activity to show yet.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <span>Student</span>
                    <span>Goals</span>
                    <span>Tasks</span>
                    <span>Habits</span>
                  </div>
                  {pulseRows.map((row: any) => (
                    <button
                      key={row.student._id}
                      type="button"
                      onClick={() => navigate(`/admin/students/${row.student._id}`)}
                      className="grid w-full grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/40"
                    >
                      <span className="truncate text-sm font-medium text-foreground">
                        {row.student.displayName}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {row.metrics.goalsCompleted}/{row.metrics.goalsTotal}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className={`block h-full rounded-full ${pulseTone(
                              row.metrics.taskCompletionPercent
                            )}`}
                            style={{ width: `${row.metrics.taskCompletionPercent}%` }}
                          />
                        </span>
                        <span className="w-8 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                          {row.metrics.taskCompletionPercent}%
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className={`block h-full rounded-full ${pulseTone(
                              row.metrics.habitConsistencyPercent
                            )}`}
                            style={{ width: `${row.metrics.habitConsistencyPercent}%` }}
                          />
                        </span>
                        <span className="w-8 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                          {row.metrics.habitConsistencyPercent}%
                        </span>
                      </span>
                    </button>
                  ))}
                  {(insights.students ?? []).length > 8 && (
                    <button
                      type="button"
                      onClick={() => setExpandedPulse((v) => !v)}
                      className="w-full pt-1 text-center text-xs text-muted-foreground hover:text-foreground"
                    >
                      {expandedPulse
                        ? "Show fewer"
                        : `Show all ${(insights.students ?? []).length} students`}
                    </button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Confirmations strip */}
          <Card className="border-black/10 bg-white/80 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-2xl">To confirm</CardTitle>
                  <CardDescription>Work students marked done.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/confirmations")}
                >
                  Open
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(confirmations ?? []).length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">All confirmed. Nothing waiting.</p>
                </div>
              ) : (
                (confirmations ?? []).slice(0, 5).map((item: any) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => navigate("/admin/confirmations")}
                    className="flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-background/80 px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-background"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={item.user?.avatarUrl} alt={item.user?.displayName} />
                      <AvatarFallback>{item.user?.displayName?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.user?.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.objective?.title}
                      </p>
                    </div>
                    {item.domain?.name && (
                      <Badge variant="outline" className="hidden sm:inline-flex">
                        {item.domain.name}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sprint pulse */}
          <Card className="border-black/10 bg-white/80 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Sprint pulse
                  </p>
                  <p className="mt-1 truncate font-serif text-xl text-foreground">
                    {sprintPulse.state === "none" ? "No active sprint" : sprintPulse.name}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/sprints")}>
                  <Calendar className="mr-1.5 h-4 w-4" />
                  Open
                </Button>
              </div>
              {sprintPulse.state === "active" && (
                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">
                      Day{" "}
                      <span className="font-mono font-medium text-foreground">
                        {sprintPulse.dayIndex}
                      </span>{" "}
                      of {sprintPulse.totalDays}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {sprintPulse.progress}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${sprintPulse.progress}%` }}
                    />
                  </div>
                </div>
              )}
              {sprintPulse.state === "ended" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Ended{" "}
                  {sprintPulse.endedDaysAgo === 0
                    ? "today"
                    : `${sprintPulse.endedDaysAgo} day${
                        sprintPulse.endedDaysAgo === 1 ? "" : "s"
                      } ago`}
                  {" — "}time to plan the next cycle.
                </p>
              )}
              {sprintPulse.state === "upcoming" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Starts soon — {sprintPulse.totalDays} days planned.
                </p>
              )}
              {sprintPulse.state === "none" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Create a sprint so students have a current cycle.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
