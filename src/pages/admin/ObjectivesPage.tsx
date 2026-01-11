import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Target,
  Loader2,
  BookOpen,
  Users,
  Check,
  Video,
  Edit2,
  Trash2,
  ExternalLink,
  Gamepad2,
  FileText,
  Dumbbell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ActivityType = "video" | "exercise" | "reading" | "project" | "game";

// Activity type icons
const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  exercise: <Dumbbell className="h-4 w-4" />,
  reading: <FileText className="h-4 w-4" />,
  project: <Target className="h-4 w-4" />,
  game: <Gamepad2 className="h-4 w-4" />,
};

/**
 * Learning Objectives Management Page
 * Create and manage learning objectives organized by domain
 * Includes assignment functionality and activity management
 */
export function ObjectivesPage() {
  const { user } = useAuth();
  const domains = useQuery(api.domains.getAll);
  const students = useQuery(api.users.getAll);
  const createObjective = useMutation(api.objectives.create);
  const updateObjective = useMutation(api.objectives.update);
  const removeObjective = useMutation(api.objectives.remove);
  const assignToMultiple = useMutation(api.objectives.assignToMultipleStudents);

  // Activity mutations
  const createActivity = useMutation(api.activities.create);
  const updateActivity = useMutation(api.activities.update);
  const removeActivity = useMutation(api.activities.remove);

  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Derive active domain: use selected or default to first domain
  const activeDomainId = selectedDomain || domains?.[0]?._id || null;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditObjectiveDialogOpen, setIsEditObjectiveDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<any>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<any>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Activity management state
  const [expandedObjectiveId, setExpandedObjectiveId] = useState<string | null>(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [newActivity, setNewActivity] = useState({
    title: "",
    type: "video" as ActivityType,
    url: "",
    platform: "",
  });

  // Form state for edit objective
  const [editObjectiveForm, setEditObjectiveForm] = useState({
    title: "",
    description: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    estimatedHours: 1,
  });

  // Form state for new objective
  const [newObjective, setNewObjective] = useState({
    title: "",
    description: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    estimatedHours: 1,
    domainId: "",
  });

  // Get objectives for active domain (selected or first)
  const objectives = useQuery(
    api.objectives.getByDomain,
    activeDomainId ? { domainId: activeDomainId as any } : "skip"
  );

  // Get assigned students for selected objective
  const assignedStudents = useQuery(
    api.objectives.getAssignedStudents,
    selectedObjective ? { objectiveId: selectedObjective._id } : "skip"
  );

  // Get activities for expanded objective
  const activities = useQuery(
    api.activities.getByObjective,
    expandedObjectiveId ? { objectiveId: expandedObjectiveId as any } : "skip"
  );

  const handleCreateObjective = async () => {
    if (!user?._id || !newObjective.domainId) return;

    setIsLoading(true);
    setError(null);

    try {
      await createObjective({
        domainId: newObjective.domainId as any,
        title: newObjective.title,
        description: newObjective.description,
        difficulty: newObjective.difficulty,
        estimatedHours: newObjective.estimatedHours,
        createdBy: user._id as any,
      });

      setIsAddDialogOpen(false);
      setNewObjective({
        title: "",
        description: "",
        difficulty: "beginner",
        estimatedHours: 1,
        domainId: activeDomainId || "",
      });
    } catch (err) {
      setError("An error occurred while creating the objective");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignClick = (objective: any) => {
    setSelectedObjective(objective);
    setSelectedStudentIds(new Set());
    setIsAssignDialogOpen(true);
  };

  const handleToggleStudent = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const handleAssignStudents = async () => {
    if (!user?._id || !selectedObjective || selectedStudentIds.size === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      await assignToMultiple({
        objectiveId: selectedObjective._id,
        studentIds: Array.from(selectedStudentIds) as any[],
        assignedBy: user._id as any,
      });

      setIsAssignDialogOpen(false);
      setSelectedObjective(null);
      setSelectedStudentIds(new Set());
    } catch (err) {
      setError("An error occurred while assigning students");
    } finally {
      setIsLoading(false);
    }
  };

  // Activity handlers
  const handleOpenActivityDialog = (objectiveId: string, activity?: any) => {
    setExpandedObjectiveId(objectiveId);
    if (activity) {
      setEditingActivity(activity);
      setNewActivity({
        title: activity.title,
        type: activity.type,
        url: activity.url,
        platform: activity.platform || "",
      });
    } else {
      setEditingActivity(null);
      setNewActivity({
        title: "",
        type: "video",
        url: "",
        platform: "",
      });
    }
    setIsActivityDialogOpen(true);
  };

  const handleSaveActivity = async () => {
    if (!expandedObjectiveId || !newActivity.title || !newActivity.url) return;

    setIsLoading(true);
    setError(null);

    try {
      if (editingActivity) {
        await updateActivity({
          activityId: editingActivity._id,
          title: newActivity.title,
          type: newActivity.type,
          url: newActivity.url,
          platform: newActivity.platform || undefined,
        });
      } else {
        const activityCount = activities?.length || 0;
        await createActivity({
          objectiveId: expandedObjectiveId as any,
          title: newActivity.title,
          type: newActivity.type,
          url: newActivity.url,
          platform: newActivity.platform || undefined,
          order: activityCount + 1,
        });
      }

      setIsActivityDialogOpen(false);
      setEditingActivity(null);
      setNewActivity({ title: "", type: "video", url: "", platform: "" });
    } catch (err) {
      setError("An error occurred while saving the activity");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      await removeActivity({ activityId: activityId as any });
    } catch (err) {
      setError("Failed to delete activity");
    }
  };

  // Objective edit/delete handlers
  const handleOpenEditObjectiveDialog = (objective: any) => {
    setEditingObjective(objective);
    setEditObjectiveForm({
      title: objective.title,
      description: objective.description,
      difficulty: objective.difficulty,
      estimatedHours: objective.estimatedHours || 1,
    });
    setIsEditObjectiveDialogOpen(true);
  };

  const handleUpdateObjective = async () => {
    if (!editingObjective) return;

    setIsLoading(true);
    setError(null);

    try {
      await updateObjective({
        objectiveId: editingObjective._id,
        title: editObjectiveForm.title,
        description: editObjectiveForm.description,
        difficulty: editObjectiveForm.difficulty,
        estimatedHours: editObjectiveForm.estimatedHours,
      });

      setIsEditObjectiveDialogOpen(false);
      setEditingObjective(null);
      setEditObjectiveForm({
        title: "",
        description: "",
        difficulty: "beginner",
        estimatedHours: 1,
      });
    } catch (err) {
      setError("An error occurred while updating the objective");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    if (!confirm("Are you sure you want to delete this objective? This will also delete all associated activities and student assignments.")) return;

    try {
      await removeObjective({ objectiveId: objectiveId as any });
    } catch (err) {
      setError("Failed to delete objective");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "";
    }
  };

  // Get already assigned student IDs
  const alreadyAssignedIds = new Set(
    assignedStudents?.map((a: any) => a.userId) || []
  );

  // Filter out already assigned students
  const availableStudents = students?.filter(
    (s: any) => !alreadyAssignedIds.has(s._id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Learning Objectives</h1>
          <p className="text-muted-foreground">
            Manage deep work objectives organized by domain
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Objective
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Learning Objective</DialogTitle>
              <DialogDescription>
                Add a new learning objective that students can work towards mastering.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain *</label>
                <Select
                  value={newObjective.domainId}
                  onValueChange={(value) =>
                    setNewObjective({ ...newObjective, domainId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains?.map((domain: any) => (
                      <SelectItem key={domain._id} value={domain._id}>
                        {domain.icon} {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="e.g., Basic Addition"
                  value={newObjective.title}
                  onChange={(e) =>
                    setNewObjective({ ...newObjective, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Input
                  placeholder="What will students learn?"
                  value={newObjective.description}
                  onChange={(e) =>
                    setNewObjective({ ...newObjective, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select
                    value={newObjective.difficulty}
                    onValueChange={(value: "beginner" | "intermediate" | "advanced") =>
                      setNewObjective({ ...newObjective, difficulty: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Est. Hours</label>
                  <Input
                    type="number"
                    min="1"
                    value={newObjective.estimatedHours}
                    onChange={(e) =>
                      setNewObjective({
                        ...newObjective,
                        estimatedHours: parseInt(e.target.value) || 1,
                      })
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
                onClick={handleCreateObjective}
                disabled={
                  isLoading ||
                  !newObjective.title ||
                  !newObjective.description ||
                  !newObjective.domainId
                }
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Objective
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Objective Dialog */}
      <Dialog open={isEditObjectiveDialogOpen} onOpenChange={(open) => {
        setIsEditObjectiveDialogOpen(open);
        if (!open) {
          setEditingObjective(null);
          setEditObjectiveForm({
            title: "",
            description: "",
            difficulty: "beginner",
            estimatedHours: 1,
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Objective</DialogTitle>
            <DialogDescription>
              Update the learning objective details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="e.g., Basic Addition"
                value={editObjectiveForm.title}
                onChange={(e) =>
                  setEditObjectiveForm({ ...editObjectiveForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Input
                placeholder="What will students learn?"
                value={editObjectiveForm.description}
                onChange={(e) =>
                  setEditObjectiveForm({ ...editObjectiveForm, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select
                  value={editObjectiveForm.difficulty}
                  onValueChange={(value: "beginner" | "intermediate" | "advanced") =>
                    setEditObjectiveForm({ ...editObjectiveForm, difficulty: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Est. Hours</label>
                <Input
                  type="number"
                  min="1"
                  value={editObjectiveForm.estimatedHours}
                  onChange={(e) =>
                    setEditObjectiveForm({
                      ...editObjectiveForm,
                      estimatedHours: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditObjectiveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateObjective}
              disabled={
                isLoading ||
                !editObjectiveForm.title ||
                !editObjectiveForm.description
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Students Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={(open) => {
        setIsAssignDialogOpen(open);
        if (!open) {
          setSelectedObjective(null);
          setSelectedStudentIds(new Set());
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Students</DialogTitle>
            <DialogDescription>
              Select students to assign to "{selectedObjective?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Already assigned students */}
            {assignedStudents && assignedStudents.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2 text-muted-foreground">
                  Already assigned ({assignedStudents.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {assignedStudents.map((assignment: any) => (
                    <Badge key={assignment._id} variant="secondary">
                      {assignment.user?.displayName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Available students */}
            <p className="text-sm font-medium mb-2">
              Available students ({availableStudents?.length || 0})
            </p>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {availableStudents && availableStudents.length > 0 ? (
                availableStudents.map((student: any) => (
                  <div
                    key={student._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedStudentIds.has(student._id)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => handleToggleStudent(student._id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.avatarUrl} alt={student.displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {student.displayName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{student.displayName}</p>
                      {student.batch && (
                        <p className="text-xs text-muted-foreground">Batch {student.batch}</p>
                      )}
                    </div>
                    {selectedStudentIds.has(student._id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All students are already assigned to this objective
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignStudents}
              disabled={isLoading || selectedStudentIds.size === 0}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign {selectedStudentIds.size > 0 && `(${selectedStudentIds.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={(open) => {
        setIsActivityDialogOpen(open);
        if (!open) {
          setEditingActivity(null);
          setNewActivity({ title: "", type: "video", url: "", platform: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Edit Activity" : "Add Activity"}</DialogTitle>
            <DialogDescription>
              {editingActivity
                ? "Update the activity details"
                : "Add a learning resource for students to complete"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="e.g., Watch intro video"
                value={newActivity.title}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type *</label>
              <Select
                value={newActivity.type}
                onValueChange={(value: ActivityType) =>
                  setNewActivity({ ...newActivity, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL *</label>
              <Input
                placeholder="https://..."
                value={newActivity.url}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, url: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform (optional)</label>
              <Input
                placeholder="e.g., YouTube, Khan Academy"
                value={newActivity.platform}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, platform: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveActivity}
              disabled={isLoading || !newActivity.title || !newActivity.url}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingActivity ? "Save Changes" : "Add Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain tabs */}
      {domains && domains.length > 0 ? (
        <Tabs
          value={activeDomainId || ""}
          onValueChange={setSelectedDomain}
        >
          <TabsList className="flex-wrap h-auto gap-2">
            {domains.map((domain: any) => (
              <TabsTrigger
                key={domain._id}
                value={domain._id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="mr-2">{domain.icon}</span>
                {domain.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {domains.map((domain: any) => (
            <TabsContent key={domain._id} value={domain._id} className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{domain.icon}</span>
                    <div>
                      <CardTitle>{domain.name}</CardTitle>
                      <CardDescription>{domain.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeDomainId === domain._id && objectives && objectives.length > 0 ? (
                    <div className="space-y-3">
                      {objectives.map((objective: any) => {
                        const isExpanded = expandedObjectiveId === objective._id;
                        return (
                          <div
                            key={objective._id}
                            className="rounded-lg border bg-card overflow-hidden"
                          >
                            {/* Objective header */}
                            <div className="flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Target className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{objective.title}</p>
                                  <Badge
                                    className={getDifficultyColor(objective.difficulty)}
                                  >
                                    {objective.difficulty}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {objective.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  {objective.estimatedHours && (
                                    <p className="text-xs text-muted-foreground">
                                      ~{objective.estimatedHours} hours
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleOpenEditObjectiveDialog(objective)}
                                  title="Edit objective"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteObjective(objective._id)}
                                  title="Delete objective"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedObjectiveId(isExpanded ? null : objective._id)}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAssignClick(objective)}
                                >
                                  <Users className="h-4 w-4 mr-1" />
                                  Assign
                                </Button>
                              </div>
                            </div>

                            {/* Activities section (expandable) */}
                            {isExpanded && (
                              <div className="border-t bg-muted/30 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-medium">
                                    Activities ({activities?.length || 0})
                                  </h4>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenActivityDialog(objective._id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Activity
                                  </Button>
                                </div>
                                {activities && activities.length > 0 ? (
                                  <div className="space-y-2">
                                    {activities.map((activity: any) => (
                                      <div
                                        key={activity._id}
                                        className="flex items-center gap-3 p-3 bg-background rounded-lg border"
                                      >
                                        <div className="p-1.5 rounded bg-muted">
                                          {ACTIVITY_ICONS[activity.type as ActivityType] || <FileText className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">
                                            {activity.title}
                                          </p>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="capitalize">{activity.type}</span>
                                            {activity.platform && (
                                              <>
                                                <span>•</span>
                                                <span>{activity.platform}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => window.open(activity.url, "_blank")}
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleOpenActivityDialog(objective._id, activity)}
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteActivity(activity._id)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    No activities yet. Add videos, readings, or exercises for students.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        No objectives in this domain yet
                      </p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setNewObjective({
                            ...newObjective,
                            domainId: domain._id,
                          });
                          setIsAddDialogOpen(true);
                        }}
                        className="mt-2"
                      >
                        Add the first objective
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No domains configured</p>
              <p className="text-sm text-muted-foreground">
                Domains need to be set up before adding objectives
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ObjectivesPage;
