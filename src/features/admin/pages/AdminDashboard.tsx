import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDelayedLoading } from "@/shared/hooks/useDelayedLoading";
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
  Clock3,
  Heart,
  ListChecks,
  MessageSquare,
  Search,
  Target,
} from "lucide-react";

function formatShortTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-muted-foreground">{body}</p>
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const students = useQuery(api.users.getAll);
  const activeSprint = useQuery(api.sprints.getActive);
  const vivaRequests = useQuery(api.mastery.getAdminVivaQueue) as any[] | undefined;
  const pendingUnlockRequests = useQuery(api.diagnostics.getPendingUnlockRequests) as any[] | undefined;
  const todayCheckIns = useQuery(api.users.getTodayCheckInCount);
  const todayCheckInsDetails = useQuery(api.emotions.getTodayCheckIns) as any[] | undefined;
  const objectives = useQuery(api.objectives.getAll);

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
    vivaRequests === undefined ||
    pendingUnlockRequests === undefined ||
    todayCheckIns === undefined ||
    todayCheckInsDetails === undefined ||
    objectives === undefined;

  const showSkeleton = useDelayedLoading(isLoading);

  const studentJumpList = useMemo(() => (students ?? []).slice(0, 5), [students]);
  const latestCheckIns = useMemo(
    () => (todayCheckInsDetails ?? []).slice(0, 5),
    [todayCheckInsDetails]
  );

  if (showSkeleton) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-28 w-full rounded-3xl" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <Skeleton className="h-[520px] rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">
          Welcome back, {user?.displayName?.split(" ")[0] || "Coach"}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Your admin home now points to the next coaching decisions first, with today&apos;s
          student context alongside them.
        </p>
      </div>

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
              <p className="font-medium text-foreground">Add objectives</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {setupChecklist.hasObjectives
                  ? `${objectives?.length ?? 0} created`
                  : "Define what students will master"}
              </p>
            </button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-black/10 bg-white/80 shadow-none">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          {[
            {
              label: "Pending vivas",
              value: vivaRequests?.length ?? 0,
              hint: "Coach review decisions",
              icon: CheckCircle,
              path: "/admin/viva",
            },
            {
              label: "Diagnostics",
              value: pendingUnlockRequests?.length ?? 0,
              hint: "Retake requests waiting",
              icon: ListChecks,
              path: "/admin/diagnostics",
            },
            {
              label: "Check-ins today",
              value: todayCheckIns ?? 0,
              hint: "Emotional check-ins logged",
              icon: Clock3,
              path: "/admin/students",
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className="rounded-2xl border border-black/10 bg-background/80 px-4 py-4 text-left transition-colors hover:bg-background"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
                </div>
                <item.icon className="mt-1 h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <Card className="border-black/10 bg-white/80 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-2xl">Needs attention now</CardTitle>
            <CardDescription>
              Open the full workspace when you need to review more than the next few items.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3 border-b border-border/70 pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">Viva</h3>
                  <p className="text-sm text-muted-foreground">
                    Coach mastery reviews waiting on a decision.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/viva")}>
                  Open viva
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              {vivaRequests && vivaRequests.length > 0 ? (
                <div className="space-y-3">
                  {vivaRequests.slice(0, 3).map((request: any) => (
                    <button
                      key={request._id}
                      type="button"
                      onClick={() => navigate("/admin/viva")}
                      className="w-full rounded-2xl border border-black/10 bg-background/80 px-4 py-4 text-left transition-colors hover:bg-background"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{request.user?.displayName}</p>
                          <p className="text-sm text-muted-foreground">{request.objective?.title}</p>
                        </div>
                        <Badge variant="outline">{request.domain?.name}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="No viva decisions waiting." body="You are caught up on mastery reviews." />
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">Diagnostics</h3>
                  <p className="text-sm text-muted-foreground">
                    Retake approvals and attempt review.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/diagnostics")}
                >
                  Open diagnostics
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              {pendingUnlockRequests && pendingUnlockRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingUnlockRequests.slice(0, 3).map((request: any) => (
                    <button
                      key={request._id}
                      type="button"
                      onClick={() => navigate("/admin/diagnostics")}
                      className="w-full rounded-2xl border border-black/10 bg-background/80 px-4 py-4 text-left transition-colors hover:bg-background"
                    >
                      <p className="font-medium text-foreground">
                        {request.user?.displayName || request.student?.displayName || "Student"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.majorObjective?.title || "Retake request"}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="No retake requests waiting." body="Diagnostics approval is clear right now." />
              )}
            </section>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-black/10 bg-white/80 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-2xl">Open student</CardTitle>
                  <CardDescription>Jump into a learner profile quickly.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/students")}>
                  <Search className="mr-1 h-4 w-4" />
                  Open list
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {studentJumpList.length > 0 ? (
                <>
                  {studentJumpList.map((student: any) => (
                    <button
                      key={student._id}
                      type="button"
                      onClick={() => navigate(`/admin/students/${student._id}`)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-background/80 px-4 py-3 text-left transition-colors hover:bg-background"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatarUrl} alt={student.displayName} />
                        <AvatarFallback>{student.displayName?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{student.displayName}</p>
                        <p className="truncate text-sm text-muted-foreground">@{student.username}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </>
              ) : (
                <EmptyState title="No students yet." body="Create students before coaching work can begin." />
              )}
            </CardContent>
          </Card>

          <Card className="border-black/10 bg-white/80 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                    <Heart className="h-5 w-5 text-rose-500" />
                    Today&apos;s check-ins
                  </CardTitle>
                  <CardDescription>
                    Daily emotional context beside the decision queue.
                  </CardDescription>
                </div>
                <Badge variant="secondary">{todayCheckIns ?? 0}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestCheckIns.length > 0 ? (
                latestCheckIns.map((checkIn: any) => (
                  <button
                    key={checkIn._id}
                    type="button"
                    onClick={() => navigate(`/admin/students/${checkIn.userId}`)}
                    className="w-full rounded-2xl border border-black/10 bg-background/80 px-4 py-4 text-left transition-colors hover:bg-background"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={checkIn.user?.avatarUrl} alt={checkIn.user?.displayName} />
                        <AvatarFallback>{checkIn.user?.displayName?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-medium text-foreground">{checkIn.user?.displayName}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatShortTime(checkIn.timestamp)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{checkIn.category?.emoji || "😐"}</span>
                          <span>{checkIn.category?.name}</span>
                          {checkIn.subcategory ? <span>• {checkIn.subcategory.name}</span> : null}
                        </div>
                        {checkIn.journalEntry ? (
                          <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                            <p className="line-clamp-2">{checkIn.journalEntry}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState title="No check-ins yet today." body="This panel will fill as students log their day." />
              )}
            </CardContent>
          </Card>

          <Card className="border-black/10 bg-white/80 shadow-none">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-foreground">Manage sprint</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeSprint ? activeSprint.name : "No active sprint"}
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/admin/sprints")}>
                <Calendar className="mr-2 h-4 w-4" />
                Open
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
