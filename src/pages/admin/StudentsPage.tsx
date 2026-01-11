import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSessionToken } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  UserX,
  Loader2,
  Pencil,
} from "lucide-react";

// Available batch options
const BATCH_OPTIONS = ["2156", "2153"];

/**
 * Students Management Page
 * List, add, and manage student accounts with batch filtering
 */
export function StudentsPage() {
  const navigate = useNavigate();
  const token = useSessionToken();
  const students = useQuery(api.users.getAll);
  const batches = useQuery(api.users.getBatches);
  const createUser = useMutation(api.auth.createUser);
  const updateBatch = useMutation(api.users.updateBatch);
  const removeUser = useMutation(api.users.remove);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditBatchDialogOpen, setIsEditBatchDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [deletingStudent, setDeletingStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for new student
  const [newStudent, setNewStudent] = useState({
    displayName: "",
    username: "",
    password: "",
    batch: "",
  });

  // Filter students based on search and batch
  const filteredStudents = students?.filter((student: any) => {
    const matchesSearch =
      student.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch =
      filterBatch === "all" || student.batch === filterBatch;
    return matchesSearch && matchesBatch;
  });

  // Get all unique batches (including from BATCH_OPTIONS)
  const allBatches = [...new Set([...BATCH_OPTIONS, ...(batches || [])])].sort();

  const handleCreateStudent = async () => {
    if (!token) {
      setError("Session expired. Please refresh the page and log in again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createUser({
        username: newStudent.username,
        password: newStudent.password,
        displayName: newStudent.displayName,
        role: "student",
        adminToken: token,
        batch: newStudent.batch || undefined,
      });

      if (result.success) {
        setIsAddDialogOpen(false);
        setNewStudent({ displayName: "", username: "", password: "", batch: "" });
      } else {
        setError(result.error || "Failed to create student");
      }
    } catch (err) {
      setError("An error occurred while creating the student");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBatchClick = (student: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setIsEditBatchDialogOpen(true);
  };

  const handleUpdateBatch = async (batch: string | undefined) => {
    if (!selectedStudent) return;
    setIsLoading(true);

    try {
      await updateBatch({
        userId: selectedStudent._id,
        batch: batch || undefined,
      });
      setIsEditBatchDialogOpen(false);
      setSelectedStudent(null);
    } catch (err) {
      setError("Failed to update batch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDeleteDialog = (student: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setIsLoading(true);

    try {
      await removeUser({ userId: deletingStudent._id as any });
      setIsDeleteDialogOpen(false);
      setDeletingStudent(null);
    } catch (err) {
      console.error("Failed to delete student:", err);
      setError("Failed to remove student");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Students</h1>
          <p className="text-muted-foreground">
            Manage student accounts and track their progress
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Create a new student account. They can log in with the username
                and password you set.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  placeholder="e.g., John Smith"
                  value={newStudent.displayName}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, displayName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  placeholder="e.g., john.smith"
                  value={newStudent.username}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, username: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Set a password"
                  value={newStudent.password}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch</label>
                <Select
                  value={newStudent.batch}
                  onValueChange={(value) =>
                    setNewStudent({ ...newStudent, batch: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {BATCH_OPTIONS.map((batch) => (
                      <SelectItem key={batch} value={batch}>
                        {batch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                onClick={handleCreateStudent}
                disabled={
                  isLoading ||
                  !newStudent.displayName ||
                  !newStudent.username ||
                  !newStudent.password
                }
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Student
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Batch Dialog */}
      <Dialog open={isEditBatchDialogOpen} onOpenChange={setIsEditBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Update batch for {selectedStudent?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={selectedStudent?.batch || "none"}
              onValueChange={(value) => handleUpdateBatch(value === "none" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No batch</SelectItem>
                {BATCH_OPTIONS.map((batch) => (
                  <SelectItem key={batch} value={batch}>
                    {batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditBatchDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Student Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletingStudent(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {deletingStudent?.displayName}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 mb-4 text-sm rounded-md bg-destructive/10 text-destructive">
              <strong>Warning:</strong> This will permanently delete all of the student's data including:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Goals and action items</li>
                <li>Habits and tracking history</li>
                <li>Emotion check-ins</li>
                <li>Learning progress and viva requests</li>
                <li>Reading history</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
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
              Remove Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search and filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterBatch} onValueChange={setFilterBatch}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All batches</SelectItem>
                  {allBatches.map((batch) => (
                    <SelectItem key={batch} value={batch}>
                      {batch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary">
                {filteredStudents?.length || 0} students
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents && filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student: any) => (
                  <TableRow
                    key={student._id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/students/${student._id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={student.avatarUrl}
                            alt={student.displayName}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {student.displayName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      @{student.username}
                    </TableCell>
                    <TableCell>
                      {student.batch ? (
                        <Badge variant="outline">{student.batch}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(student.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.lastLoginAt
                        ? formatDate(student.lastLoginAt)
                        : "Never"}
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
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/students/${student._id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleEditBatchClick(student, e)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Batch
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => handleOpenDeleteDialog(student, e)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Remove Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              {searchQuery || filterBatch !== "all" ? (
                <>
                  <p className="text-muted-foreground">
                    No students found
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterBatch("all");
                    }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">No students yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first student to get started
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentsPage;
