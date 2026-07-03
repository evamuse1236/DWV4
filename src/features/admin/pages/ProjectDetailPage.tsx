import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Circle,
  Download,
  Search,
  MessageSquarePlus,
} from "lucide-react";
import { StudentProjectCard } from "@/features/admin/components/projects/StudentProjectCard";
import { ProjectDataChat } from "@/features/admin/components/projects/ProjectDataChat";

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
  const { token } = useAuth();

  // Queries
  const project = useQuery(
    api.projects.getById,
    projectId && token
      ? { adminToken: token, projectId: projectId as Id<"projects"> }
      : "skip"
  );
  const adminArgs = token ? { adminToken: token } : "skip";
  const students = useQuery(api.users.getAll, adminArgs);
  const batches = useQuery(api.users.getBatches, adminArgs);
  const allLinks = useQuery(
    api.projectLinks.getByProject,
    projectId && token
      ? { adminToken: token, projectId: projectId as Id<"projects"> }
      : "skip"
  );
  const allReflections = useQuery(
    api.projectReflections.getByProject,
    projectId && token
      ? { adminToken: token, projectId: projectId as Id<"projects"> }
      : "skip"
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

      // Status filter (must match badge logic in StudentProjectCard)
      let matchesStatus = true;
      if (statusFilter !== "all") {
        const hasLinks = student.links.length > 0;
        const hasPartialReflection = !!(
          student.reflection?.didWell ||
          student.reflection?.projectDescription ||
          student.reflection?.couldImprove
        );
        const isComplete = hasLinks && student.reflection?.isComplete;

        if (statusFilter === "complete") {
          matchesStatus = !!isComplete;
        } else if (statusFilter === "partial") {
          matchesStatus = (hasLinks || hasPartialReflection) && !isComplete;
        } else if (statusFilter === "empty") {
          matchesStatus = !hasLinks && !hasPartialReflection;
        }
      }

      return matchesSearch && matchesBatch && matchesStatus;
    });
  }, [studentsWithData, searchQuery, batchFilter, statusFilter]);

  // Calculate stats (must match badge logic in StudentProjectCard)
  const stats = useMemo(() => {
    const total = studentsWithData.length;
    const complete = studentsWithData.filter((s) => {
      const hasLinks = s.links.length > 0;
      return hasLinks && s.reflection?.isComplete;
    }).length;
    const partial = studentsWithData.filter((s) => {
      const hasLinks = s.links.length > 0;
      const hasPartialReflection = !!(
        s.reflection?.didWell ||
        s.reflection?.projectDescription ||
        s.reflection?.couldImprove
      );
      const isComplete = hasLinks && s.reflection?.isComplete;
      return (hasLinks || hasPartialReflection) && !isComplete;
    }).length;
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

  // One row per student: reflections, links, completion — Sheets-ready.
  const handleExportCsv = () => {
    const escape = (value: string | undefined | null) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const header = [
      "Student",
      "Username",
      "Batch",
      "Status",
      "What went well",
      "Project description",
      "Could improve",
      "Links",
    ];
    const rows = studentsWithData.map((student) => {
      const hasLinks = student.links.length > 0;
      const isComplete = hasLinks && student.reflection?.isComplete;
      const hasPartial = !!(
        student.reflection?.didWell ||
        student.reflection?.projectDescription ||
        student.reflection?.couldImprove
      );
      const status = isComplete
        ? "Complete"
        : hasLinks || hasPartial
          ? "Partial"
          : "No data";
      return [
        student.displayName,
        student.username,
        student.batch ?? "",
        status,
        student.reflection?.didWell,
        student.reflection?.projectDescription,
        student.reflection?.couldImprove,
        student.links.map((l) => `${l.title}: ${l.url}`).join(" | "),
      ]
        .map(escape)
        .join(",");
    });
    const csv = [header.map(escape).join(","), ...rows].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.name.replaceAll(/[^\w-]+/g, "-")}-data.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsChatOpen(true)}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            AI Assistant
          </Button>
        </div>
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
              adminToken={token}
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
          adminToken={token}
          projectId={projectId as Id<"projects">}
          projectName={project.name}
          students={studentsWithData}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}

export default ProjectDetailPage;
