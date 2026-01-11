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
  Check,
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

  // Queries
  const student = useQuery(
    api.users.getById,
    studentId ? { userId: studentId as any } : "skip"
  );
  const assignedObjectives = useQuery(
    api.objectives.getAssignedToStudent,
    studentId ? { userId: studentId as any } : "skip"
  );
  const domains = useQuery(api.domains.getAll);
  const allObjectives = useQuery(api.objectives.getAll);

  // Mutations
  const assignObjective = useMutation(api.objectives.assignToStudent);
  const unassignObjective = useMutation(api.objectives.unassignFromStudent);

  // State
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("all");
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get objectives already assigned to this student
  const assignedObjectiveIds = new Set(
    assignedObjectives?.map((a: any) => a.objectiveId) || []
  );

  // Filter available objectives (not already assigned)
  const availableObjectives = allObjectives?.filter(
    (obj: any) =>
      !assignedObjectiveIds.has(obj._id) &&
      (selectedDomainId === "all" || obj.domainId === selectedDomainId)
  );

  const handleAssignObjective = async () => {
    if (!user?._id || !studentId || !selectedObjectiveId) return;

    setIsLoading(true);
    setError(null);

    try {
      await assignObjective({
        userId: studentId as any,
        objectiveId: selectedObjectiveId as any,
        assignedBy: user._id as any,
      });

      setIsAssignDialogOpen(false);
      setSelectedObjectiveId("");
      setSelectedDomainId("all");
    } catch (err) {
      setError("Failed to assign objective");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignObjective = async (objectiveId: string) => {
    if (!studentId) return;
    if (!confirm("Are you sure you want to unassign this objective from the student?")) return;

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

  // Group objectives by domain
  const objectivesByDomain = assignedObjectives?.reduce((acc: any, assignment: any) => {
    const domainId = assignment.domain?._id || "unknown";
    if (!acc[domainId]) {
      acc[domainId] = {
        domain: assignment.domain,
        objectives: [],
      };
    }
    acc[domainId].objectives.push(assignment);
    return acc;
  }, {});

  // Calculate stats
  const totalAssigned = assignedObjectives?.length || 0;
  const masteredCount = assignedObjectives?.filter((a: any) => a.status === "mastered").length || 0;
  const inProgressCount = assignedObjectives?.filter((a: any) => a.status === "in_progress").length || 0;
  const vivaRequestedCount = assignedObjectives?.filter((a: any) => a.status === "viva_requested").length || 0;

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/students")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-semibold">Student Details</h1>
          <p className="text-muted-foreground">
            View and manage student objectives
          </p>
        </div>
      </div>

      {/* Student info card */}
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

      {/* Assign Objective Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Objective</DialogTitle>
            <DialogDescription>
              Select an objective to assign to {student.displayName}
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
                      {domain.icon} {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Objective *</label>
              <Select value={selectedObjectiveId} onValueChange={setSelectedObjectiveId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an objective" />
                </SelectTrigger>
                <SelectContent>
                  {availableObjectives && availableObjectives.length > 0 ? (
                    availableObjectives.map((obj: any) => (
                      <SelectItem key={obj._id} value={obj._id}>
                        {obj.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No available objectives
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
              disabled={isLoading || !selectedObjectiveId}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assigned Objectives */}
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
              <Plus className="mr-2 h-4 w-4" />
              Assign Objective
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assignedObjectives && assignedObjectives.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(objectivesByDomain || {}).map(([domainId, group]: [string, any]) => (
                <div key={domainId}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{group.domain?.icon || "📚"}</span>
                    <h3 className="font-semibold">{group.domain?.name || "Unknown Domain"}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {group.objectives.length} objective{group.objectives.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="space-y-2 ml-8">
                    {group.objectives.map((assignment: any) => (
                      <div
                        key={assignment._id}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{assignment.objective?.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {assignment.objective?.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(assignment.status)}
                          {assignment.status !== "mastered" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleUnassignObjective(assignment.objectiveId)}
                              title="Unassign objective"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {assignment.status === "mastered" && (
                            <Check className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No objectives assigned yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Assign learning objectives to track this student's progress
              </p>
              <Button onClick={() => setIsAssignDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Assign First Objective
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentDetailPage;
