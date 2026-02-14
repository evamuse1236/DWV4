import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Play,
  Trash2,
  Edit,
  Calendar,
  Loader2,
} from "lucide-react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Sprint Management Page
 * Create, manage, and track learning sprints
 */
export function SprintsPage() {
  const { user } = useAuth();
  const sprints = useQuery(api.sprints.getAll);
  const activeSprint = useQuery(api.sprints.getActive);
  const [selectedInsightsSprintId, setSelectedInsightsSprintId] = useState("");
  const studentInsights = useQuery(
    api.sprints.getStudentInsights,
    selectedInsightsSprintId
      ? { sprintId: selectedInsightsSprintId as any }
      : "skip"
  );
  const createSprint = useMutation(api.sprints.create);
  const updateSprint = useMutation(api.sprints.update);
  const setActive = useMutation(api.sprints.setActive);
  const deleteSprint = useMutation(api.sprints.remove);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<any>(null);
  const [deletingSprint, setDeletingSprint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Form state for new sprint
  const [newSprint, setNewSprint] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  // Form state for editing sprint
  const [editForm, setEditForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (!sprints || sprints.length === 0) return;

    const hasSelection = sprints.some(
      (sprint: any) => sprint._id === selectedInsightsSprintId
    );
    if (hasSelection) return;

    const fallbackSprintId = (activeSprint?._id || sprints[0]._id) as string;
    setSelectedInsightsSprintId(fallbackSprintId);
  }, [sprints, activeSprint?._id, selectedInsightsSprintId]);

  const filteredStudentInsights = useMemo(() => {
    const students = studentInsights?.students || [];
    const query = studentSearchQuery.trim().toLowerCase();
    if (!query) return students;

    return students.filter((entry: any) => {
      const batchLabel = entry.student.batch ? `batch ${entry.student.batch}` : "";
      const haystack = [
        entry.student.displayName,
        entry.student.username,
        batchLabel,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [studentInsights?.students, studentSearchQuery]);

  const insightsSummary = useMemo(() => {
    if (!filteredStudentInsights || filteredStudentInsights.length === 0) {
      return {
        totalStudents: 0,
        studentsWithAnyGoals: 0,
        avgTaskCompletion: 0,
        avgHabitConsistency: 0,
        avgEngagementScore: 0,
      };
    }

    const totalStudents = filteredStudentInsights.length;
    const studentsWithAnyGoals = filteredStudentInsights.filter(
      (entry: any) => entry.metrics.goalsTotal > 0
    ).length;

    const avgTaskCompletion = Math.round(
      filteredStudentInsights.reduce(
        (sum: number, entry: any) => sum + entry.metrics.taskCompletionPercent,
        0
      ) / totalStudents
    );
    const avgHabitConsistency = Math.round(
      filteredStudentInsights.reduce(
        (sum: number, entry: any) =>
          sum + entry.metrics.habitConsistencyPercent,
        0
      ) / totalStudents
    );
    const avgEngagementScore = Math.round(
      filteredStudentInsights.reduce(
        (sum: number, entry: any) => sum + entry.metrics.engagementScore,
        0
      ) / totalStudents
    );

    return {
      totalStudents,
      studentsWithAnyGoals,
      avgTaskCompletion,
      avgHabitConsistency,
      avgEngagementScore,
    };
  }, [filteredStudentInsights]);

  const handleCreateSprint = async () => {
    if (!user?._id) return;

    setIsLoading(true);
    setError(null);

    try {
      await createSprint({
        name: newSprint.name,
        startDate: newSprint.startDate,
        endDate: newSprint.endDate,
        createdBy: user._id as any,
      });

      setIsAddDialogOpen(false);
      setNewSprint({ name: "", startDate: "", endDate: "" });
    } catch (err) {
      setError("An error occurred while creating the sprint");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditDialog = (sprint: any) => {
    setEditingSprint(sprint);
    setEditForm({
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSprint = async () => {
    if (!editingSprint) return;

    setIsLoading(true);
    setError(null);

    try {
      await updateSprint({
        sprintId: editingSprint._id,
        name: editForm.name,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });

      setIsEditDialogOpen(false);
      setEditingSprint(null);
      setEditForm({ name: "", startDate: "", endDate: "" });
    } catch (err) {
      setError("An error occurred while updating the sprint");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetActive = async (sprintId: string) => {
    try {
      await setActive({ sprintId: sprintId as any });
    } catch (err) {
      console.error("Failed to set active sprint:", err);
    }
  };

  const handleOpenDeleteDialog = (sprint: any) => {
    setDeletingSprint(sprint);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSprint) return;

    setIsLoading(true);
    try {
      await deleteSprint({ sprintId: deletingSprint._id as any });
      setIsDeleteDialogOpen(false);
      setDeletingSprint(null);
    } catch (err) {
      console.error("Failed to delete sprint:", err);
      setError("Failed to delete sprint");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysLeft = (endDate: string) => {
    const days = Math.ceil(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const formatTaskSchedule = (task: any) => {
    const dayLabel = DAY_LABELS[task.dayOfWeek] || "Day";
    const timeLabel = task.scheduledTime ? ` • ${task.scheduledTime}` : "";
    return `Week ${task.weekNumber} • ${dayLabel}${timeLabel}`;
  };

  const getScoreClassName = (score: number) => {
    if (score >= 80) return "bg-emerald-100 text-emerald-800";
    if (score >= 60) return "bg-amber-100 text-amber-800";
    return "bg-rose-100 text-rose-700";
  };

  const getGoalStatusBadge = (status: string) => {
    if (status === "completed") {
      return <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>;
    }
    if (status === "in_progress") {
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    }
    return <Badge variant="outline">Not Started</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Sprints</h1>
          <p className="text-muted-foreground">
            Manage learning sprints and time-boxed goals
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
              <DialogDescription>
                Set up a new learning sprint with a defined time period. Creating
                a new sprint will automatically make it active.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sprint Name</label>
                <Input
                  placeholder="e.g., Spring 2024 Sprint"
                  value={newSprint.name}
                  onChange={(e) =>
                    setNewSprint({ ...newSprint, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={newSprint.startDate}
                    onChange={(e) =>
                      setNewSprint({ ...newSprint, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={newSprint.endDate}
                    onChange={(e) =>
                      setNewSprint({ ...newSprint, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSprint}
                disabled={
                  isLoading ||
                  !newSprint.name ||
                  !newSprint.startDate ||
                  !newSprint.endDate
                }
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Sprint
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Sprint Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingSprint(null);
          setEditForm({ name: "", startDate: "", endDate: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sprint</DialogTitle>
            <DialogDescription>
              Update the sprint details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sprint Name</label>
              <Input
                placeholder="e.g., Spring 2024 Sprint"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSprint}
              disabled={
                isLoading ||
                !editForm.name ||
                !editForm.startDate ||
                !editForm.endDate
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sprint Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletingSprint(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sprint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingSprint?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {deletingSprint?.isActive && (
              <div className="p-3 mb-4 text-sm rounded-md bg-destructive/10 text-destructive">
                <strong>Warning:</strong> This is the currently active sprint.
                Deleting it will remove all associated student goals and progress.
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The sprint and any associated data will be
              permanently removed.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Sprint Card */}
      {activeSprint && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge>Active</Badge>
                <CardTitle>{activeSprint.name}</CardTitle>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {getDaysLeft(activeSprint.endDate)}
                </p>
                <p className="text-sm text-muted-foreground">days left</p>
              </div>
            </div>
            <CardDescription>
              {formatDate(activeSprint.startDate)} -{" "}
              {formatDate(activeSprint.endDate)}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Student Goal Insights</CardTitle>
              <CardDescription>
                One place to review each student&apos;s goals, tasks, habits, and sprint progress.
              </CardDescription>
              {studentInsights?.sprint && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {studentInsights.sprint.name}: Day {studentInsights.sprint.elapsedDays} of{" "}
                  {studentInsights.sprint.totalDays}
                </p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[520px]">
              <Select
                value={selectedInsightsSprintId}
                onValueChange={setSelectedInsightsSprintId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  {(sprints || []).map((sprint: any) => (
                    <SelectItem key={sprint._id} value={sprint._id}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Search by name, username, or batch"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedInsightsSprintId ? (
            <p className="text-sm text-muted-foreground">
              Select a sprint to load student insights.
            </p>
          ) : studentInsights === undefined ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading student insights...
            </div>
          ) : !studentInsights ? (
            <p className="text-sm text-muted-foreground">
              This sprint no longer exists.
            </p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Students In View</p>
                  <p className="text-2xl font-semibold">{insightsSummary.totalStudents}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Students With Goals</p>
                  <p className="text-2xl font-semibold">
                    {insightsSummary.studentsWithAnyGoals}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Avg Task Completion</p>
                  <p className="text-2xl font-semibold">{insightsSummary.avgTaskCompletion}%</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Avg Habit Consistency</p>
                  <p className="text-2xl font-semibold">
                    {insightsSummary.avgHabitConsistency}%
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/10 p-3">
                <p className="text-xs text-muted-foreground">Overall Engagement</p>
                <p className="text-xl font-semibold">{insightsSummary.avgEngagementScore}%</p>
              </div>

              {filteredStudentInsights.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No students match this search.
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredStudentInsights.map((entry: any) => (
                    <div key={entry.student._id} className="rounded-lg border p-4 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold">{entry.student.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            @{entry.student.username}
                            {entry.student.batch ? ` • Batch ${entry.student.batch}` : ""}
                          </p>
                        </div>
                        <Badge className={getScoreClassName(entry.metrics.engagementScore)}>
                          Engagement {entry.metrics.engagementScore}%
                        </Badge>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">Goals</p>
                          <p className="font-semibold">
                            {entry.metrics.goalsCompleted}/{entry.metrics.goalsTotal} completed
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.metrics.goalCompletionPercent}% completion
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">Tasks</p>
                          <p className="font-semibold">
                            {entry.metrics.tasksCompleted}/{entry.metrics.tasksTotal} done
                          </p>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-blue-500"
                              style={{
                                width: `${entry.metrics.taskCompletionPercent}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">Habits</p>
                          <p className="font-semibold">
                            {entry.metrics.habitCompletedTotal}/
                            {entry.metrics.habitExpectedTotal} check-ins
                          </p>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-emerald-500"
                              style={{
                                width: `${entry.metrics.habitConsistencyPercent}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">What they are doing</p>
                          {entry.currentFocus.goals.length > 0 ? (
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {entry.currentFocus.goals.map((goalTitle: string) => (
                                <li key={goalTitle}>Goal: {goalTitle}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No active goals.</p>
                          )}
                          {entry.currentFocus.tasks.length > 0 ? (
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {entry.currentFocus.tasks.map((task: any) => (
                                <li key={task._id}>
                                  Task: {task.title} ({formatTaskSchedule(task)})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No pending tasks.</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Goals and task status</p>
                          {entry.goals.length > 0 ? (
                            <div className="space-y-2">
                              {entry.goals.map((goal: any) => (
                                <div
                                  key={goal._id}
                                  className="rounded-md border p-2 text-sm"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">{goal.title}</span>
                                    {getGoalStatusBadge(goal.status)}
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {goal.tasksCompleted}/{goal.tasksTotal} tasks complete
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No goals set.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium">Habits</p>
                        {entry.habits.length > 0 ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {entry.habits.map((habit: any) => (
                              <div key={habit._id} className="rounded-md border p-2 text-sm">
                                <p className="font-medium">{habit.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {habit.completedCount}/{habit.expectedCount} days
                                  {" "}({habit.consistencyPercent}%)
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No habits tracked.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Sprints List */}
      <Card>
        <CardHeader>
          <CardTitle>All Sprints</CardTitle>
          <CardDescription>
            Historical and upcoming sprints
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sprints && sprints.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sprint</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sprints.map((sprint: any) => {
                  const daysLeft = getDaysLeft(sprint.endDate);
                  const isActive = sprint.isActive;
                  const isPast = daysLeft < 0;
                  const isFuture =
                    new Date(sprint.startDate).getTime() > Date.now();

                  return (
                    <TableRow key={sprint._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{sprint.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(sprint.startDate)} -{" "}
                        {formatDate(sprint.endDate)}
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <Badge>Active</Badge>
                        ) : isPast ? (
                          <Badge variant="secondary">Completed</Badge>
                        ) : isFuture ? (
                          <Badge variant="outline">Upcoming</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isActive && (
                              <DropdownMenuItem
                                onClick={() => handleSetActive(sprint._id)}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Set Active
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleOpenEditDialog(sprint)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleOpenDeleteDialog(sprint)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No sprints yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first sprint to get started
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Sprint
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SprintsPage;
