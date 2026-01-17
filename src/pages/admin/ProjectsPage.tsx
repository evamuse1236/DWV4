import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Edit,
  ExternalLink,
  FolderKanban,
  Loader2,
  MoreHorizontal,
  Play,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

interface Project {
  _id: Id<"projects">;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  cycleNumber: number;
  createdBy: Id<"users">;
  createdAt: number;
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const projects = useQuery(api.projects.getAll);
  const activeProject = useQuery(api.projects.getActive);
  const nextCycleNumber = useQuery(api.projects.getNextCycleNumber);
  const studentCount = useQuery(api.users.getStudentCount);

  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const setActive = useMutation(api.projects.setActive);
  const deleteProject = useMutation(api.projects.remove);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for new project
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // Form state for editing project
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    cycleNumber: 1,
  });

  const handleCreateProject = async () => {
    if (!user?._id || nextCycleNumber === undefined) return;

    setIsLoading(true);
    setError(null);

    try {
      await createProject({
        name: newProject.name,
        description: newProject.description || undefined,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
        cycleNumber: nextCycleNumber,
        createdBy: user._id as Id<"users">,
      });

      setIsAddDialogOpen(false);
      setNewProject({ name: "", description: "", startDate: "", endDate: "" });
    } catch {
      setError("An error occurred while creating the project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditDialog = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      name: project.name,
      description: project.description || "",
      startDate: project.startDate,
      endDate: project.endDate,
      cycleNumber: project.cycleNumber,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    setIsLoading(true);
    setError(null);

    try {
      await updateProject({
        projectId: editingProject._id,
        name: editForm.name,
        description: editForm.description || undefined,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        cycleNumber: editForm.cycleNumber,
      });

      setIsEditDialogOpen(false);
      setEditingProject(null);
      setEditForm({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        cycleNumber: 1,
      });
    } catch {
      setError("An error occurred while updating the project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetActive = async (projectId: Id<"projects">) => {
    try {
      await setActive({ projectId });
    } catch (err) {
      console.error("Failed to set active project:", err);
    }
  };

  const handleOpenDeleteDialog = (project: Project) => {
    setDeletingProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;

    setIsLoading(true);
    try {
      await deleteProject({ projectId: deletingProject._id });
      setIsDeleteDialogOpen(false);
      setDeletingProject(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError("Failed to delete project");
    } finally {
      setIsLoading(false);
    }
  };

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getDaysLeft(endDate: string): number {
    return Math.ceil(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }

  function getWeeksLeft(endDate: string): number {
    return Math.ceil(getDaysLeft(endDate) / 7);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Projects</h1>
          <p className="text-muted-foreground">
            Manage 6-week learning project cycles
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Set up a new 6-week project cycle. This will be Project{" "}
                {nextCycleNumber ?? "..."}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  placeholder="e.g., Project 3: Renewable Energy"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description (optional)
                </label>
                <Textarea
                  placeholder="Brief description of this project cycle..."
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({ ...newProject, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) =>
                      setNewProject({ ...newProject, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) =>
                      setNewProject({ ...newProject, endDate: e.target.value })
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
                onClick={handleCreateProject}
                disabled={
                  isLoading ||
                  !newProject.name ||
                  !newProject.startDate ||
                  !newProject.endDate
                }
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Project Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingProject(null);
            setEditForm({
              name: "",
              description: "",
              startDate: "",
              endDate: "",
              cycleNumber: 1,
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                placeholder="e.g., Project 3: Renewable Energy"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                placeholder="Brief description of this project cycle..."
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={2}
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Cycle Number</label>
              <Input
                type="number"
                min={1}
                value={editForm.cycleNumber}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    cycleNumber: parseInt(e.target.value) || 1,
                  })
                }
              />
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
              onClick={handleUpdateProject}
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

      {/* Delete Project Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setDeletingProject(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingProject?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {deletingProject?.isActive && (
              <div className="p-3 mb-4 text-sm rounded-md bg-destructive/10 text-destructive">
                <strong>Warning:</strong> This is the currently active project.
                Deleting it will remove all associated student links and
                reflections.
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The project and all associated data
              (links, reflections) will be permanently removed.
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
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Project Card */}
      {activeProject && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge>Active</Badge>
                <CardTitle>{activeProject.name}</CardTitle>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {getWeeksLeft(activeProject.endDate)}
                </p>
                <p className="text-sm text-muted-foreground">weeks left</p>
              </div>
            </div>
            <CardDescription>
              {formatDate(activeProject.startDate)} -{" "}
              {formatDate(activeProject.endDate)}
              {activeProject.description && (
                <span className="block mt-1">{activeProject.description}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{studentCount ?? 0} students</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/projects/${activeProject._id}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Enter Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>Historical and current project cycles</CardDescription>
        </CardHeader>
        <CardContent>
          {projects && projects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project: Project) => {
                  const daysLeft = getDaysLeft(project.endDate);
                  const isActive = project.isActive;
                  const isPast = daysLeft < 0;
                  const isFuture =
                    new Date(project.startDate).getTime() > Date.now();

                  return (
                    <TableRow
                      key={project._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/projects/${project._id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{project.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              Cycle {project.cycleNumber}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(project.startDate)} -{" "}
                        {formatDate(project.endDate)}
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
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isActive && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetActive(project._id);
                                }}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Set Active
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDialog(project);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteDialog(project);
                              }}
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
                <FolderKanban className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No projects yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first project cycle to get started
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProjectsPage;
