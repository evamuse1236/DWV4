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

/**
 * Sprint Management Page
 * Create, manage, and track learning sprints
 */
export function SprintsPage() {
  const { user } = useAuth();
  const sprints = useQuery(api.sprints.getAll);
  const activeSprint = useQuery(api.sprints.getActive);
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
