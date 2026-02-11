import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Target,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  Award,
  Loader2,
} from "lucide-react";

/**
 * Student Detail Page
 * View student info, assigned objectives, and manage assignments
 */
export function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const student = useQuery(
    api.users.getById,
    studentId ? { userId: studentId as any } : "skip"
  );
  const assignedMajors = useQuery(
    api.objectives.getAssignedToStudent,
    studentId ? { userId: studentId as any } : "skip"
  );
  const domains = useQuery(api.domains.getAll);
  const allSubObjectives = useQuery(api.objectives.getAllSubObjectives);
  const character = useQuery(
    api.character.getStudentCharacter,
    studentId ? { userId: studentId as any } : "skip"
  );

  const assignObjective = useMutation(api.objectives.assignToStudent);
  const unassignObjective = useMutation(api.objectives.unassignFromStudent);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("all");
  const [selectedSubObjectiveId, setSelectedSubObjectiveId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!user?._id || !studentId || !selectedSubObjectiveId) return;

    setIsLoading(true);
    setError(null);

    try {
      await assignObjective({
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
    if (!studentId) return;
    if (!confirm("Are you sure you want to unassign this sub objective from the student?")) return;

    try {
      await unassignObjective({
        userId: studentId as any,
        objectiveId: objectiveId as any,
      });
    } catch (err) {
      setError("Failed to unassign objective");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Assigned</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><AlertCircle className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "viva_requested":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><AlertCircle className="h-3 w-3 mr-1" />Viva Requested</Badge>;
      case "mastered":
        return <Badge className="bg-green-100 text-green-800"><Award className="h-3 w-3 mr-1" />Mastered</Badge>;
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

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const majorsByDomain = assignedMajors?.reduce((acc: any, entry: any) => {
    const domainId = entry.domain?._id || "unknown";
    if (!acc[domainId]) {
      acc[domainId] = {
        domain: entry.domain,
        majors: [],
      };
    }
    acc[domainId].majors.push(entry);
    return acc;
  }, {});

  const totalAssigned = assignedMajors?.length || 0;
  const masteredCount = assignedMajors?.filter((a: any) => a.assignment?.status === "mastered").length || 0;
  const inProgressCount = assignedMajors?.filter((a: any) => a.assignment?.status === "in_progress").length || 0;
  const vivaRequestedCount = assignedMajors?.filter((a: any) => a.assignment?.status === "viva_requested").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/students")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-semibold">Student Details</h1>
          <p className="text-muted-foreground">
            View and manage student objectives
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={student.avatarUrl} alt={student.displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {student.displayName?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{student.displayName}</h2>
              <p className="text-muted-foreground">@{student.username}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {student.batch && (
                  <Badge variant="outline">Batch {student.batch}</Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  Joined {formatDate(student.createdAt)}
                </span>
                {student.lastLoginAt && (
                  <span className="text-sm text-muted-foreground">
                    Last active {formatDate(student.lastLoginAt)}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{totalAssigned}</p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{inProgressCount}</p>
                <p className="text-xs text-blue-600">In Progress</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-700">{vivaRequestedCount}</p>
                <p className="text-xs text-yellow-600">Viva Pending</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{masteredCount}</p>
                <p className="text-xs text-green-600">Mastered</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Character Progress</CardTitle>
          <CardDescription>
            XP progression, active card, and recent character events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {character === undefined ? (
            <p className="text-sm text-muted-foreground">Loading character data...</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Total XP</p>
                  <p className="text-xl font-semibold">{character?.summary.totalXp ?? 0}</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="text-xl font-semibold">{character?.summary.level ?? 1}</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Badges</p>
                  <p className="text-xl font-semibold">{character?.summary.badgeCount ?? 0}</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Unlocked Cards</p>
                  <p className="text-xl font-semibold">
                    {character?.summary.unlockedCards ?? 0}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                <div className="h-[160px] overflow-hidden rounded-md border bg-muted">
                  {character?.activeCard?.imageUrl ? (
                    <img
                      src={character.activeCard.imageUrl}
                      alt={character.activeCard.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-muted-foreground">
                      No active card
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Top Domain Stats</p>
                  {character?.domainStats && character.domainStats.length > 0 ? (
                    character.domainStats.slice(0, 3).map((stat: any) => (
                      <div
                        key={stat._id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <span>{stat.domain?.name || "Unknown Domain"}</span>
                        <Badge variant="outline">
                          Lv. {stat.statLevel} • {stat.xp} XP
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No domain XP tracked yet.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Recent XP Events</p>
                {character?.recentXp && character.recentXp.length > 0 ? (
                  <div className="space-y-2">
                    {character.recentXp.slice(0, 5).map((entry: any) => (
                      <div
                        key={entry._id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {entry.sourceType.replaceAll("_", " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(entry.awardedAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.domain?.name || "Unmapped domain"}
                          </p>
                        </div>
                        <Badge variant="outline">+{entry.xpAwarded} XP</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No XP events recorded yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
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
                        {obj.majorObjective?.title ? `${obj.majorObjective.title} → ` : ""}{obj.title}
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assigned Objectives</CardTitle>
              <CardDescription>
                Learning objectives assigned to this student
              </CardDescription>
            </div>
            <Button onClick={() => setIsAssignDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Sub Objective
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assignedMajors && assignedMajors.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(majorsByDomain || {}).map(([domainId, group]: [string, any]) => (
                <div key={domainId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{group.domain?.name || "Unknown Domain"}</h3>
                    <Badge variant="outline">{group.majors.length} majors</Badge>
                  </div>

                  <div className="space-y-3">
                    {group.majors.map((major: any) => (
                      <div key={major.majorObjective._id} className="rounded-lg border bg-card">
                        <div className="p-4 flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{major.majorObjective.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {major.majorObjective.description}
                            </p>
                            <div className="mt-2">
                              {getStatusBadge(major.assignment?.status || "assigned")}
                            </div>
                          </div>
                        </div>
                        <div className="border-t bg-muted/20 p-4 space-y-2">
                          {major.subObjectives.map((sub: any) => (
                            <div key={sub._id} className="flex items-center justify-between gap-3 p-2 rounded bg-background">
                              <div>
                                <p className="text-sm font-medium">{sub.objective.title}</p>
                                <p className="text-xs text-muted-foreground">{sub.objective.description}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleUnassignObjective(sub.objective._id)}
                                title="Unassign sub objective"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
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
    </div>
  );
}

export default StudentDetailPage;
