import { useMemo, useState } from "react";
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

type Difficulty = "beginner" | "intermediate" | "advanced";

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  exercise: <Dumbbell className="h-4 w-4" />,
  reading: <FileText className="h-4 w-4" />,
  project: <Target className="h-4 w-4" />,
  game: <Gamepad2 className="h-4 w-4" />,
};

export function ObjectivesPage() {
  const { user } = useAuth();
  const domains = useQuery(api.domains.getAll);
  const students = useQuery(api.users.getAll);

  const createMajor = useMutation(api.objectives.create);
  const updateMajor = useMutation(api.objectives.update);
  const removeMajor = useMutation(api.objectives.remove);

  const createSubObjective = useMutation(api.objectives.createSubObjective);
  const updateSubObjective = useMutation(api.objectives.updateSubObjective);
  const removeSubObjective = useMutation(api.objectives.removeSubObjective);
  const assignToMultiple = useMutation(api.objectives.assignToMultipleStudents);

  const createActivity = useMutation(api.activities.create);
  const updateActivity = useMutation(api.activities.update);
  const removeActivity = useMutation(api.activities.remove);

  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const activeDomainId = selectedDomain || domains?.[0]?._id || null;

  const majors = useQuery(
    api.objectives.getByDomain,
    activeDomainId ? { domainId: activeDomainId as any } : "skip"
  );

  const [isAddMajorDialogOpen, setIsAddMajorDialogOpen] = useState(false);
  const [isEditMajorDialogOpen, setIsEditMajorDialogOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<any>(null);
  const [newMajor, setNewMajor] = useState({
    title: "",
    description: "",
    difficulty: "beginner" as Difficulty,
    estimatedHours: 1,
    domainId: "",
  });
  const [editMajorForm, setEditMajorForm] = useState({
    title: "",
    description: "",
    difficulty: "beginner" as Difficulty,
    estimatedHours: 1,
  });

  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);
  const [editingSubObjective, setEditingSubObjective] = useState<any>(null);
  const [selectedMajorForSub, setSelectedMajorForSub] = useState<any>(null);
  const [newSubObjective, setNewSubObjective] = useState({
    title: "",
    description: "",
    difficulty: "beginner" as Difficulty,
    estimatedHours: 1,
  });

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedSubObjective, setSelectedSubObjective] = useState<any>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const [expandedSubObjectiveId, setExpandedSubObjectiveId] = useState<string | null>(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [newActivity, setNewActivity] = useState({
    title: "",
    type: "video" as ActivityType,
    url: "",
    platform: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignedStudents = useQuery(
    api.objectives.getAssignedStudents,
    selectedSubObjective ? { objectiveId: selectedSubObjective._id } : "skip"
  );

  const activities = useQuery(
    api.activities.getByObjective,
    expandedSubObjectiveId ? { objectiveId: expandedSubObjectiveId as any } : "skip"
  );

  const availableStudents = useMemo(() => {
    const alreadyAssignedIds = new Set(
      assignedStudents?.map((a: any) => a.userId) || []
    );
    return students?.filter((s: any) => !alreadyAssignedIds.has(s._id)) || [];
  }, [assignedStudents, students]);

  const handleCreateMajor = async () => {
    if (!user?._id || !newMajor.domainId) return;
    setIsLoading(true);
    setError(null);

    try {
      await createMajor({
        domainId: newMajor.domainId as any,
        title: newMajor.title,
        description: newMajor.description,
        difficulty: newMajor.difficulty,
        estimatedHours: newMajor.estimatedHours,
        createdBy: user._id as any,
      });

      setIsAddMajorDialogOpen(false);
      setNewMajor({
        title: "",
        description: "",
        difficulty: "beginner",
        estimatedHours: 1,
        domainId: activeDomainId || "",
      });
    } catch (err) {
      setError("An error occurred while creating the major objective");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMajor = async () => {
    if (!editingMajor) return;
    setIsLoading(true);
    setError(null);

    try {
      await updateMajor({
        objectiveId: editingMajor._id,
        title: editMajorForm.title,
        description: editMajorForm.description,
        difficulty: editMajorForm.difficulty,
        estimatedHours: editMajorForm.estimatedHours,
      });

      setIsEditMajorDialogOpen(false);
      setEditingMajor(null);
      setEditMajorForm({
        title: "",
        description: "",
        difficulty: "beginner",
        estimatedHours: 1,
      });
    } catch (err) {
      setError("An error occurred while updating the major objective");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMajor = async (objectiveId: string) => {
    if (!confirm("Delete this major objective and all its sub objectives?")) return;

    try {
      await removeMajor({ objectiveId: objectiveId as any });
    } catch (err) {
      setError("Failed to delete major objective");
    }
  };

  const handleOpenEditMajor = (major: any) => {
    setEditingMajor(major);
    setEditMajorForm({
      title: major.title,
      description: major.description,
      difficulty: major.difficulty || "beginner",
      estimatedHours: major.estimatedHours || 1,
    });
    setIsEditMajorDialogOpen(true);
  };

  const handleOpenSubDialog = (major: any, sub?: any) => {
    setSelectedMajorForSub(major);
    if (sub) {
      setEditingSubObjective(sub);
      setNewSubObjective({
        title: sub.title,
        description: sub.description,
        difficulty: sub.difficulty,
        estimatedHours: sub.estimatedHours || 1,
      });
    } else {
      setEditingSubObjective(null);
      setNewSubObjective({
        title: "",
        description: "",
        difficulty: "beginner",
        estimatedHours: 1,
      });
    }
    setIsSubDialogOpen(true);
  };

  const handleSaveSubObjective = async () => {
    if (!selectedMajorForSub || !newSubObjective.title || !newSubObjective.description) return;
    setIsLoading(true);
    setError(null);

    try {
      if (editingSubObjective) {
        await updateSubObjective({
          objectiveId: editingSubObjective._id,
          title: newSubObjective.title,
          description: newSubObjective.description,
          difficulty: newSubObjective.difficulty,
          estimatedHours: newSubObjective.estimatedHours,
        });
      } else {
        await createSubObjective({
          majorObjectiveId: selectedMajorForSub._id,
          title: newSubObjective.title,
          description: newSubObjective.description,
          difficulty: newSubObjective.difficulty,
          estimatedHours: newSubObjective.estimatedHours,
          createdBy: user?._id as any,
        });
      }

      setIsSubDialogOpen(false);
      setEditingSubObjective(null);
      setSelectedMajorForSub(null);
      setNewSubObjective({
        title: "",
        description: "",
        difficulty: "beginner",
        estimatedHours: 1,
      });
    } catch (err) {
      setError("An error occurred while saving the sub objective");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubObjective = async (objectiveId: string) => {
    if (!confirm("Delete this sub objective and its activities?")) return;

    try {
      await removeSubObjective({ objectiveId: objectiveId as any });
    } catch (err) {
      setError("Failed to delete sub objective");
    }
  };

  const handleAssignClick = (objective: any) => {
    setSelectedSubObjective(objective);
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
    if (!user?._id || !selectedSubObjective || selectedStudentIds.size === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      await assignToMultiple({
        objectiveId: selectedSubObjective._id,
        studentIds: Array.from(selectedStudentIds) as any[],
        assignedBy: user._id as any,
      });

      setIsAssignDialogOpen(false);
      setSelectedSubObjective(null);
      setSelectedStudentIds(new Set());
    } catch (err) {
      setError("An error occurred while assigning students");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenActivityDialog = (subObjectiveId: string, activity?: any) => {
    setExpandedSubObjectiveId(subObjectiveId);
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
    if (!expandedSubObjectiveId || !newActivity.title || !newActivity.url) return;

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
          objectiveId: expandedSubObjectiveId as any,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Learning Objectives</h1>
          <p className="text-muted-foreground">
            Create major objectives and attach sub objectives with activities
          </p>
        </div>
        <Dialog open={isAddMajorDialogOpen} onOpenChange={setIsAddMajorDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Major Objective
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Major Objective</DialogTitle>
              <DialogDescription>
                Major objectives act as the main nodes in the skill tree.
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
                  value={newMajor.domainId}
                  onValueChange={(value) =>
                    setNewMajor({ ...newMajor, domainId: value })
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
                  placeholder="e.g., Fractions Fundamentals"
                  value={newMajor.title}
                  onChange={(e) =>
                    setNewMajor({ ...newMajor, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Input
                  placeholder="What does this major unlock?"
                  value={newMajor.description}
                  onChange={(e) =>
                    setNewMajor({ ...newMajor, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select
                    value={newMajor.difficulty}
                    onValueChange={(value: Difficulty) =>
                      setNewMajor({ ...newMajor, difficulty: value })
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
                    value={newMajor.estimatedHours}
                    onChange={(e) =>
                      setNewMajor({
                        ...newMajor,
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
                onClick={() => setIsAddMajorDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMajor}
                disabled={
                  isLoading ||
                  !newMajor.title ||
                  !newMajor.description ||
                  !newMajor.domainId
                }
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Major
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditMajorDialogOpen} onOpenChange={(open) => {
        setIsEditMajorDialogOpen(open);
        if (!open) {
          setEditingMajor(null);
          setEditMajorForm({
            title: "",
            description: "",
            difficulty: "beginner",
            estimatedHours: 1,
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Major Objective</DialogTitle>
            <DialogDescription>
              Update the major objective details.
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
                placeholder="e.g., Fractions Fundamentals"
                value={editMajorForm.title}
                onChange={(e) =>
                  setEditMajorForm({ ...editMajorForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Input
                placeholder="What does this major unlock?"
                value={editMajorForm.description}
                onChange={(e) =>
                  setEditMajorForm({ ...editMajorForm, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select
                  value={editMajorForm.difficulty}
                  onValueChange={(value: Difficulty) =>
                    setEditMajorForm({ ...editMajorForm, difficulty: value })
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
                  value={editMajorForm.estimatedHours}
                  onChange={(e) =>
                    setEditMajorForm({
                      ...editMajorForm,
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
              onClick={() => setIsEditMajorDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMajor}
              disabled={
                isLoading ||
                !editMajorForm.title ||
                !editMajorForm.description
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSubDialogOpen} onOpenChange={(open) => {
        setIsSubDialogOpen(open);
        if (!open) {
          setEditingSubObjective(null);
          setSelectedMajorForSub(null);
          setNewSubObjective({
            title: "",
            description: "",
            difficulty: "beginner",
            estimatedHours: 1,
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubObjective ? "Edit Sub Objective" : "Add Sub Objective"}</DialogTitle>
            <DialogDescription>
              {selectedMajorForSub?.title ? `Major: ${selectedMajorForSub.title}` : "Attach a sub objective to a major"}
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
                placeholder="e.g., Add fractions with like denominators"
                value={newSubObjective.title}
                onChange={(e) =>
                  setNewSubObjective({ ...newSubObjective, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Input
                placeholder="What will students master in this step?"
                value={newSubObjective.description}
                onChange={(e) =>
                  setNewSubObjective({ ...newSubObjective, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select
                  value={newSubObjective.difficulty}
                  onValueChange={(value: Difficulty) =>
                    setNewSubObjective({ ...newSubObjective, difficulty: value })
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
                  value={newSubObjective.estimatedHours}
                  onChange={(e) =>
                    setNewSubObjective({
                      ...newSubObjective,
                      estimatedHours: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubObjective}
              disabled={
                isLoading ||
                !newSubObjective.title ||
                !newSubObjective.description
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSubObjective ? "Save Changes" : "Add Sub Objective"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={(open) => {
        setIsAssignDialogOpen(open);
        if (!open) {
          setSelectedSubObjective(null);
          setSelectedStudentIds(new Set());
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Students</DialogTitle>
            <DialogDescription>
              Select students to assign to "{selectedSubObjective?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
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

            <p className="text-sm font-medium mb-2">
              Available students ({availableStudents.length})
            </p>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {availableStudents.length > 0 ? (
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
                  All students are already assigned to this sub objective
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
                  {activeDomainId === domain._id && majors && majors.length > 0 ? (
                    <div className="space-y-4">
                      {majors.map((major: any) => (
                        <div
                          key={major._id}
                          className="rounded-lg border bg-card overflow-hidden"
                        >
                          <div className="flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Target className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium">{major.title}</p>
                                {major.difficulty && (
                                  <Badge className={getDifficultyColor(major.difficulty)}>
                                    {major.difficulty}
                                  </Badge>
                                )}
                                <Badge variant="outline">
                                  {major.subObjectives?.length || 0} sub objectives
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {major.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenEditMajor(major)}
                                title="Edit major"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteMajor(major._id)}
                                title="Delete major"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenSubDialog(major)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Sub
                              </Button>
                            </div>
                          </div>

                          <div className="border-t bg-muted/30 p-4 space-y-3">
                            {major.subObjectives && major.subObjectives.length > 0 ? (
                              major.subObjectives.map((sub: any) => {
                                const isExpanded = expandedSubObjectiveId === sub._id;
                                return (
                                  <div key={sub._id} className="rounded-lg border bg-background overflow-hidden">
                                    <div
                                      className="flex items-start gap-4 p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                                      onClick={() => setExpandedSubObjectiveId(isExpanded ? null : sub._id)}
                                    >
                                      <div className="p-2 rounded-lg bg-muted">
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-sm font-medium">{sub.title}</p>
                                          <Badge className={getDifficultyColor(sub.difficulty)}>
                                            {sub.difficulty}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {sub.description}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenSubDialog(major, sub);
                                          }}
                                          title="Edit sub objective"
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSubObjective(sub._id);
                                          }}
                                          title="Delete sub objective"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="p-2">
                                          {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAssignClick(sub);
                                          }}
                                        >
                                          <Users className="h-4 w-4 mr-1" />
                                          Assign
                                        </Button>
                                      </div>
                                    </div>

                                    {isExpanded && (
                                      <div className="border-t bg-muted/20 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                          <h4 className="text-sm font-medium">
                                            Activities ({activities?.length || 0})
                                          </h4>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenActivityDialog(sub._id)}
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
                                                    onClick={() => handleOpenActivityDialog(sub._id, activity)}
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
                              })
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No sub objectives yet. Add the first sub objective for this major.
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        No major objectives in this domain yet
                      </p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setNewMajor({
                            ...newMajor,
                            domainId: domain._id,
                          });
                          setIsAddMajorDialogOpen(true);
                        }}
                        className="mt-2"
                      >
                        Add the first major objective
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
