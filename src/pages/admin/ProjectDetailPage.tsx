import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
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
  ArrowLeft,
  Users,
  CheckCircle2,
  Circle,
  Search,
  MessageSquarePlus,
} from "lucide-react";
import { StudentProjectCard } from "@/components/projects/StudentProjectCard";
import { ProjectDataChat } from "@/components/projects/ProjectDataChat";

type StudentWithData = {
  _id: Id<"users">;
  displayName: string;
  username: string;
  batch?: string;
  links: Array<{
    _id: Id<"projectLinks">;
    url: string;
    title: string;
    linkType: "presentation" | "document" | "video" | "other";
  }>;
  reflection: {
    didWell?: string;
    projectDescription?: string;
    couldImprove?: string;
    isComplete: boolean;
  } | null;
};

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Queries
  const project = useQuery(
    api.projects.getById,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const students = useQuery(api.users.getAll);
  const batches = useQuery(api.users.getBatches);
  const allLinks = useQuery(
    api.projectLinks.getByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const allReflections = useQuery(
    api.projectReflections.getByProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedStudentId, setExpandedStudentId] = useState<Id<"users"> | null>(
    null
  );
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Combine student data with their links and reflections
  const studentsWithData = useMemo((): StudentWithData[] => {
    if (!students || !allLinks || !allReflections) return [];

    return students.map((student) => {
      const links = allLinks.filter((link) => link.userId === student._id);
      const reflection = allReflections.find((r) => r.userId === student._id);

      return {
        _id: student._id,
        displayName: student.displayName,
        username: student.username,
        batch: student.batch,
        links: links.map((l) => ({
          _id: l._id,
          url: l.url,
          title: l.title,
          linkType: l.linkType,
        })),
        reflection: reflection
          ? {
              didWell: reflection.didWell,
              projectDescription: reflection.projectDescription,
              couldImprove: reflection.couldImprove,
              isComplete: reflection.isComplete,
            }
          : null,
      };
    });
  }, [students, allLinks, allReflections]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return studentsWithData.filter((student) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        student.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.username.toLowerCase().includes(searchQuery.toLowerCase());

      // Batch filter
      const matchesBatch =
        batchFilter === "all" || student.batch === batchFilter;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "complete") {
        matchesStatus = student.reflection?.isComplete === true;
      } else if (statusFilter === "partial") {
        matchesStatus =
          student.reflection !== null && !student.reflection.isComplete;
      } else if (statusFilter === "empty") {
        matchesStatus = student.reflection === null;
      }

      return matchesSearch && matchesBatch && matchesStatus;
    });
  }, [studentsWithData, searchQuery, batchFilter, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = studentsWithData.length;
    const complete = studentsWithData.filter(
      (s) => s.reflection?.isComplete
    ).length;
    const partial = studentsWithData.filter(
      (s) => s.reflection && !s.reflection.isComplete
    ).length;
    const empty = total - complete - partial;
    return { total, complete, partial, empty };
  }, [studentsWithData]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/projects")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              {project.isActive && <Badge>Active</Badge>}
              <h1 className="text-2xl font-serif font-semibold">
                {project.name}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {formatDate(project.startDate)} - {formatDate(project.endDate)}
              {project.description && (
                <span className="ml-2">• {project.description}</span>
              )}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsChatOpen(true)}>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          AI Assistant
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {stats.complete}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <Circle className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">
                  {stats.partial}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Partial</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <Circle className="h-4 w-4 text-gray-300" />
                <span className="text-2xl font-bold text-gray-400">
                  {stats.empty}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">No Data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches?.map((batch) => (
              <SelectItem key={batch} value={batch}>
                Batch {batch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="empty">No Data</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student Cards */}
      <div className="space-y-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <StudentProjectCard
              key={student._id}
              student={student}
              projectId={projectId as Id<"projects">}
              isExpanded={expandedStudentId === student._id}
              onToggleExpand={() =>
                setExpandedStudentId(
                  expandedStudentId === student._id ? null : student._id
                )
              }
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No students match your filters
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Chat */}
      {isChatOpen && projectId && (
        <ProjectDataChat
          projectId={projectId as Id<"projects">}
          students={studentsWithData}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}

export default ProjectDetailPage;
