import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  ArrowLeft,
  Target,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  Award,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

/**
 * Student 360 — identity band, mastery pipeline, objectives by domain,
 * and a compact character summary in the rail.
 */
export function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const student = useQuery(
    api.users.getById,
    studentId && token ? { adminToken: token, userId: studentId as any } : "skip"
  );
  const assignedMajors = useQuery(
    api.objectives.getAssignedToStudent,
    studentId && token ? { adminToken: token, userId: studentId as any } : "skip"
  );
  const domains = useQuery(api.domains.getAll);
  const allSubObjectives = useQuery(
    api.objectives.getAllSubObjectives,
    token ? { adminToken: token } : "skip"
  );
  const character = useQuery(
    api.character.getStudentCharacter,
    studentId && token ? { adminToken: token, userId: studentId as any } : "skip"
  );

  const assignObjective = useMutation(api.objectives.assignToStudent);
  const unassignObjective = useMutation(api.objectives.unassignFromStudent);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("all");
  const [selectedSubObjectiveId, setSelectedSubObjectiveId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMajorIds, setExpandedMajorIds] = useState<Set<string>>(new Set());

  const assignedSubObjectiveIds = new Set(
    assignedMajors?.flatMap((major: any) =>
      major.subObjectives.map((sub: any) => sub.objective._id)
    ) || []
  );

  const availableSubObjectives = allSubObjectives?.filter(
    (obj: any) =>
      !assignedSubObjectiveIds.has(obj._id) &&
      (selectedDomainId === "all" || obj.domainId === selectedDomainId)
  );

  const handleAssignObjective = async () => {
    if (!user?._id || !token || !studentId || !selectedSubObjectiveId) return;

    setIsLoading(true);
    setError(null);

    try {
      await assignObjective({
        adminToken: token,
        userId: studentId as any,
        objectiveId: selectedSubObjectiveId as any,
        assignedBy: user._id as any,
      });

      setIsAssignDialogOpen(false);
      setSelectedSubObjectiveId("");
      setSelectedDomainId("all");
    } catch (err) {
      setError("Failed to assign objective");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignObjective = async (objectiveId: string) => {
    if (!studentId || !token) return;
    if (!confirm("Are you sure you want to unassign this sub objective from the student?")) return;

    try {
      await unassignObjective({
        adminToken: token,
        userId: studentId as any,
        objectiveId: objectiveId as any,
      });
    } catch (err) {
      setError("Failed to unassign objective");
    }
  };

  const toggleMajor = (majorId: string) => {
    setExpandedMajorIds((current) => {
      const next = new Set(current);
      if (next.has(majorId)) next.delete(majorId);
      else next.add(majorId);
      return next;
    });
  };

  const getStatusBadge = (status: string, vivaStatus?: string) => {
    if (vivaStatus === "requested") {
      return (
        <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
          <AlertCircle className="mr-1 h-3 w-3" />
          Viva Pending
        </Badge>
      );
    }
    if (vivaStatus === "not_ready") {
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
          <AlertCircle className="mr-1 h-3 w-3" />
          Needs Work
        </Badge>
      );
    }
    switch (status) {
      case "assigned":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Assigned
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
            <AlertCircle className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        );
      case "mastered":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Award className="mr-1 h-3 w-3" />
            Mastered
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const majorsByDomain = useMemo(
    () =>
      assignedMajors?.reduce((acc: any, entry: any) => {
        const domainId = entry.domain?._id || "unknown";
        if (!acc[domainId]) {
          acc[domainId] = {
            domain: entry.domain,
            majors: [],
          };
        }
        acc[domainId].majors.push(entry);
        return acc;
      }, {}),
    [assignedMajors]
  );

  if (!student) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalAssigned = assignedMajors?.length || 0;
  const masteredCount =
    assignedMajors?.filter((a: any) => a.assignment?.status === "mastered").length || 0;
  const inProgressCount =
    assignedMajors?.filter((a: any) => a.assignment?.status === "in_progress").length || 0;
  const vivaRequestedCount =
    assignedMajors?.filter((a: any) => a.assignment?.vivaStatus === "requested").length || 0;

  const pipeline = [
    { label: "Assigned", value: totalAssigned, tone: "text-foreground" },
    { label: "In Progress", value: inProgressCount, tone: "text-blue-700" },
    { label: "Viva Pending", value: vivaRequestedCount, tone: "text-yellow-700" },
    { label: "Mastered", value: masteredCount, tone: "text-green-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Identity header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-1"
            onClick={() => navigate("/admin/students")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.avatarUrl} alt={student.displayName} />
              <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                {student.displayName?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Coach Work · Student
              </p>
              <h1 className="truncate text-3xl">{student.displayName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>@{student.username}</span>
                {student.batch && <Badge variant="outline">Batch {student.batch}</Badge>}
                <span>Joined {formatDate(student.createdAt)}</span>
                {student.lastLoginAt && <span>Last active {formatDate(student.lastLoginAt)}</span>}
              </div>
            </div>
          </div>
        </div>
        <Button onClick={() => setIsAssignDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Sub Objective
        </Button>
      </header>

      {/* Mastery pipeline band */}
      <Card className="shadow-none">
        <CardContent className="flex flex-wrap items-center gap-2 p-4 sm:gap-0">
          {pipeline.map((stage, index) => (
            <div key={stage.label} className="flex flex-1 items-center">
              <div className="min-w-[110px] flex-1 rounded-xl px-4 py-2 text-center">
                <p className={`font-mono text-2xl font-semibold ${stage.tone}`} data-slot="stat">
                  {stage.value}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stage.label}</p>
              </div>
              {index < pipeline.length - 1 && (
                <ChevronRight className="hidden h-4 w-4 shrink-0 text-border sm:block" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        {/* Objectives by domain */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Assigned objectives</CardTitle>
            <CardDescription>
              Grouped by domain — open a major objective to manage its sub objectives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignedMajors && assignedMajors.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(majorsByDomain || {}).map(([domainId, group]: [string, any]) => (
                  <div key={domainId} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{group.domain?.name || "Unknown Domain"}</h3>
                      <Badge variant="outline" className="font-mono">
                        {group.majors.length}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {group.majors.map((major: any) => {
                        const majorId = major.majorObjective._id;
                        const isOpen = expandedMajorIds.has(majorId);
                        return (
                          <div key={majorId} className="rounded-lg border bg-card">
                            <button
                              type="button"
                              onClick={() => toggleMajor(majorId)}
                              className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/30"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {major.majorObjective.title}
                                </p>
                                {!isOpen && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {major.subObjectives.length} sub objective
                                    {major.subObjectives.length === 1 ? "" : "s"}
                                  </p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-3">
                                {getStatusBadge(
                                  major.assignment?.status || "assigned",
                                  major.assignment?.vivaStatus
                                )}
                                <ChevronDown
                                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                                    isOpen ? "rotate-180" : ""
                                  }`}
                                />
                              </div>
                            </button>
                            {isOpen && (
                              <div className="space-y-2 border-t bg-muted/20 p-4">
                                {major.majorObjective.description && (
                                  <p className="pb-1 text-sm text-muted-foreground">
                                    {major.majorObjective.description}
                                  </p>
                                )}
                                {major.subObjectives.map((sub: any) => (
                                  <div
                                    key={sub._id}
                                    className="flex items-center justify-between gap-3 rounded bg-background p-2.5"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">
                                        {sub.objective.title}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {sub.objective.description}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                      onClick={() => handleUnassignObjective(sub.objective._id)}
                                      title="Unassign sub objective"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No objectives assigned yet</p>
                <p className="text-sm text-muted-foreground">
                  Assign learning objectives to track this student's progress
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsAssignDialogOpen(true)}
                >
                  Assign First Sub Objective
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Character summary rail */}
        <Card className="h-fit shadow-none">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Character</CardTitle>
            <CardDescription>XP, level, and recent progress events.</CardDescription>
          </CardHeader>
          <CardContent>
            {character === undefined ? (
              <p className="text-sm text-muted-foreground">Loading character data...</p>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Total XP</p>
                    <p className="font-mono text-xl font-semibold" data-slot="stat">
                      {character?.summary.totalXp ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Level</p>
                    <p className="font-mono text-xl font-semibold" data-slot="stat">
                      {character?.summary.level ?? 1}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Badges</p>
                    <p className="font-mono text-xl font-semibold" data-slot="stat">
                      {character?.summary.badgeCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Cards</p>
                    <p className="font-mono text-xl font-semibold" data-slot="stat">
                      {character?.summary.unlockedCards ?? 0}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Top domains</p>
                  {character?.domainStats && character.domainStats.length > 0 ? (
                    <div className="space-y-2">
                      {character.domainStats.slice(0, 3).map((stat: any) => (
                        <div
                          key={stat._id}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <span>{stat.domain?.name || "Unknown Domain"}</span>
                          <Badge variant="outline" className="font-mono">
                            Lv. {stat.statLevel} · {stat.xp} XP
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No domain XP tracked yet.</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Recent XP</p>
                  {character?.recentXp && character.recentXp.length > 0 ? (
                    <div className="space-y-2">
                      {character.recentXp.slice(0, 4).map((entry: any) => (
                        <div
                          key={entry._id}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium capitalize">
                              {entry.sourceType.replaceAll("_", " ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(entry.awardedAt)}
                              {entry.domain?.name ? ` · ${entry.domain.name}` : ""}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 font-mono">
                            +{entry.xpAwarded}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No XP events recorded yet.</p>
                  )}
                </div>

                {character?.activeCard?.imageUrl && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Active card</p>
                    <div className="h-[140px] overflow-hidden rounded-xl border bg-muted">
                      <img
                        src={character.activeCard.imageUrl}
                        alt={character.activeCard.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Sub Objective</DialogTitle>
            <DialogDescription>
              Select a sub objective to assign to {student.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Domain</label>
              <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
                <SelectTrigger>
                  <SelectValue placeholder="All domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All domains</SelectItem>
                  {domains?.map((domain: any) => (
                    <SelectItem key={domain._id} value={domain._id}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Sub Objective *</label>
              <Select value={selectedSubObjectiveId} onValueChange={setSelectedSubObjectiveId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sub objective" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubObjectives && availableSubObjectives.length > 0 ? (
                    availableSubObjectives.map((obj: any) => (
                      <SelectItem key={obj._id} value={obj._id}>
                        {obj.majorObjective?.title ? `${obj.majorObjective.title} → ` : ""}
                        {obj.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No available sub objectives
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignObjective}
              disabled={isLoading || !selectedSubObjectiveId || selectedSubObjectiveId === "none"}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentDetailPage;
