import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Clock,
  CheckCircle,
  Calendar,
  BookOpen,
  Target,
  ChevronRight,
  Plus,
  Heart,
  MessageSquare,
  X,
} from "lucide-react";

// Milliseconds per day constant
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Format timestamp to short time (e.g., "2:30 PM")
function formatShortTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Calculate days remaining from end date
function calculateDaysLeft(endDate: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(endDate).getTime() - Date.now()) / MS_PER_DAY)
  );
}

/**
 * Admin Dashboard - shadcn/UI version
 * Main landing page for coaches with overview stats and quick actions
 */
// localStorage key for banner dismissal
const SETUP_BANNER_KEY = "admin-setup-banner-dismissed";

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for dismissible banner
  const [showSetupBanner, setShowSetupBanner] = useState(() => {
    return localStorage.getItem(SETUP_BANNER_KEY) !== "true";
  });

  // State for expanding check-ins list
  const [showAllCheckIns, setShowAllCheckIns] = useState(false);

  // Queries
  const students = useQuery(api.users.getAll);
  const activeSprint = useQuery(api.sprints.getActive);
  const vivaRequests = useQuery(api.objectives.getVivaRequests);
  const presentationRequests = useQuery(api.books.getPresentationRequests);
  const todayCheckIns = useQuery(api.users.getTodayCheckInCount);
  const todayCheckInsDetails = useQuery(api.emotions.getTodayCheckIns);
  const objectives = useQuery(api.objectives.getAll);

  // Setup checklist: detect what's missing for a functioning learning cycle
  const setupDataLoaded =
    students !== undefined && activeSprint !== undefined && objectives !== undefined;
  const setupChecklist = {
    hasStudents: (students?.length ?? 0) > 0,
    hasActiveSprint: activeSprint !== null && activeSprint !== undefined,
    hasObjectives: (objectives?.length ?? 0) > 0,
  };
  const isFullySetup =
    setupChecklist.hasStudents &&
    setupChecklist.hasActiveSprint &&
    setupChecklist.hasObjectives;
  const needsSetup = setupDataLoaded && !isFullySetup;

  // Mutations
  const updateStatus = useMutation(api.objectives.updateStatus);
  const approvePresentationRequest = useMutation(api.books.approvePresentationRequest);

  const handleApproveViva = async (studentMajorObjectiveId: string, studentName: string): Promise<void> => {
    try {
      await updateStatus({
        studentMajorObjectiveId: studentMajorObjectiveId as any,
        status: "mastered",
      });
      toast.success(`Viva approved for ${studentName}`);
    } catch (err) {
      console.error("Failed to approve viva:", err);
      toast.error("Failed to approve viva. Please try again.");
    }
  };

  const handleApprovePresentation = async (studentBookId: string, studentName: string): Promise<void> => {
    try {
      await approvePresentationRequest({
        studentBookId: studentBookId as any,
        approved: true,
      });
      toast.success(`Presentation approved for ${studentName}`);
    } catch (err) {
      console.error("Failed to approve presentation:", err);
      toast.error("Failed to approve presentation. Please try again.");
    }
  };

  const handleDismissBanner = () => {
    localStorage.setItem(SETUP_BANNER_KEY, "true");
    setShowSetupBanner(false);
  };

  // Check if data is still loading
  const isLoading =
    students === undefined ||
    activeSprint === undefined ||
    vivaRequests === undefined ||
    presentationRequests === undefined ||
    todayCheckIns === undefined;

  // Delayed skeleton - only show if loading takes >200ms to avoid flash
  const showSkeleton = useDelayedLoading(isLoading);

  if (showSkeleton) {
    return (
      <div className="space-y-6">
        {/* Welcome header skeleton */}
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main content grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Data still loading but under threshold - render nothing briefly
  if (isLoading) {
    return null;
  }

  const sprintDaysLeft = activeSprint
    ? calculateDaysLeft(activeSprint.endDate)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-serif font-semibold text-foreground">
          Welcome back, {user?.displayName?.split(" ")[0] || "Coach"}
        </h1>
        <p className="text-muted-foreground">
          {needsSetup
            ? "Let's get your learning environment ready."
            : "Here's what's happening with your students today."}
        </p>
      </div>

      {/* Setup complete banner - dismissible */}
      {setupDataLoaded && isFullySetup && showSetupBanner && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-green-700 dark:text-green-400 font-medium">
                You're all set! Your learning cycle is ready to run.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/sprints")}
                >
                  Manage Sprint
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-700 hover:text-green-900 hover:bg-green-100"
                  onClick={handleDismissBanner}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Checklist - shows when system needs configuration */}
      {needsSetup && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Complete these steps to start your learning cycle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Step 1: Add Students */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  setupChecklist.hasStudents
                    ? "bg-green-50 border-green-200 dark:bg-green-950/30"
                    : "bg-card hover:bg-accent cursor-pointer"
                }`}
                onClick={() => !setupChecklist.hasStudents && navigate("/admin/students")}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  setupChecklist.hasStudents
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {setupChecklist.hasStudents ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">1</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${setupChecklist.hasStudents ? "text-green-700 dark:text-green-400" : ""}`}>
                    Add Students
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {setupChecklist.hasStudents
                      ? `${students?.length} student${students?.length === 1 ? "" : "s"} enrolled`
                      : "Create accounts for your learners"}
                  </p>
                </div>
                {!setupChecklist.hasStudents && (
                  <Button size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                )}
              </div>

              {/* Step 2: Create Sprint */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  setupChecklist.hasActiveSprint
                    ? "bg-green-50 border-green-200 dark:bg-green-950/30"
                    : "bg-card hover:bg-accent cursor-pointer"
                }`}
                onClick={() => !setupChecklist.hasActiveSprint && navigate("/admin/sprints")}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  setupChecklist.hasActiveSprint
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {setupChecklist.hasActiveSprint ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">2</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${setupChecklist.hasActiveSprint ? "text-green-700 dark:text-green-400" : ""}`}>
                    Create a Sprint
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {setupChecklist.hasActiveSprint
                      ? `"${activeSprint?.name}" is active`
                      : "Define a learning period with start/end dates"}
                  </p>
                </div>
                {!setupChecklist.hasActiveSprint && (
                  <Button size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Create
                  </Button>
                )}
              </div>

              {/* Step 3: Add Objectives */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  setupChecklist.hasObjectives
                    ? "bg-green-50 border-green-200 dark:bg-green-950/30"
                    : "bg-card hover:bg-accent cursor-pointer"
                }`}
                onClick={() => !setupChecklist.hasObjectives && navigate("/admin/objectives")}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  setupChecklist.hasObjectives
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {setupChecklist.hasObjectives ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">3</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${setupChecklist.hasObjectives ? "text-green-700 dark:text-green-400" : ""}`}>
                    Add Learning Objectives
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {setupChecklist.hasObjectives
                      ? `${objectives?.length} objective${objectives?.length === 1 ? "" : "s"} created`
                      : "Define what students will learn and master"}
                  </p>
                </div>
                {!setupChecklist.hasObjectives && (
                  <Button size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/students")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active learners in the system
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/viva")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Vivas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {vivaRequests?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting your review
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/sprints")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sprint</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activeSprint ? (
              <>
                <div className="text-2xl font-bold">{sprintDaysLeft}d left</div>
                <p className="text-xs text-muted-foreground truncate">
                  {activeSprint.name}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">None</div>
                <p className="text-xs text-muted-foreground mb-2">No active sprint</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/admin/sprints");
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Create Sprint
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCheckIns || 0}</div>
            <p className="text-xs text-muted-foreground">
              Emotional check-ins recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Students Overview</CardTitle>
                <CardDescription>Recent activity and progress</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/students")}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {students && students.length > 0 ? (
              <div className="space-y-3">
                {students.slice(0, 5).map((student: any) => (
                  <div
                    key={student._id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/students/${student._id}`)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatarUrl} alt={student.displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {student.displayName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{student.username}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
                {students.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{students.length - 5} more students
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No students yet.</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create student accounts to get started!
                </p>
                <Button onClick={() => navigate("/admin/students")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Viva queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Viva Queue</CardTitle>
              <Badge variant={vivaRequests?.length ? "destructive" : "secondary"}>
                {vivaRequests?.length || 0} pending
              </Badge>
            </div>
            <CardDescription>Students awaiting mastery approval</CardDescription>
          </CardHeader>
          <CardContent>
            {vivaRequests && vivaRequests.length > 0 ? (
              <div className="space-y-3">
                {vivaRequests.slice(0, 3).map((request: any) => (
                  <div
                    key={request._id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/students/${request.userId}`)}
                    title="View student details"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {request.user?.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {request.objective?.title}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {request.domain?.name}
                        </Badge>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleApproveViva(request._id, request.user?.displayName || "Student");
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Double-click to approve viva</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
                {vivaRequests.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/admin/viva")}
                  >
                    View All ({vivaRequests.length})
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No pending vivas.</p>
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Presentation Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Presentations</CardTitle>
              <Badge variant={presentationRequests?.length ? "destructive" : "secondary"}>
                {presentationRequests?.length || 0} pending
              </Badge>
            </div>
            <CardDescription>Book presentations awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            {presentationRequests && presentationRequests.length > 0 ? (
              <div className="space-y-3">
                {presentationRequests.slice(0, 3).map((request: any) => (
                  <div
                    key={request._id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {request.user?.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {request.book?.title}
                        </p>
                        {request.book?.author && (
                          <p className="text-xs text-muted-foreground truncate">
                            by {request.book.author}
                          </p>
                        )}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onDoubleClick={() => handleApprovePresentation(request._id, request.user?.displayName || "Student")}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Double-click to approve presentation</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
                {presentationRequests.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/admin/presentations")}
                  >
                    View All ({presentationRequests.length})
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No pending presentations.</p>
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Emotional Check-ins */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Today's Check-ins
              </CardTitle>
              <CardDescription>
                How your students are feeling today
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {todayCheckInsDetails?.length || 0} check-ins
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {todayCheckInsDetails && todayCheckInsDetails.length > 0 ? (
            <div className="space-y-3">
              {(showAllCheckIns ? todayCheckInsDetails : todayCheckInsDetails.slice(0, 5)).map((checkIn: any) => (
                <div
                  key={checkIn._id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/students/${checkIn.userId}`)}
                  title="View student details"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={checkIn.user?.avatarUrl}
                        alt={checkIn.user?.displayName}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {checkIn.user?.displayName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">
                          {checkIn.user?.displayName}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatShortTime(checkIn.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg">
                          {checkIn.category?.emoji || "😐"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {checkIn.category?.name}
                        </Badge>
                        {checkIn.subcategory && (
                          <span className="text-xs text-muted-foreground">
                            → {checkIn.subcategory.name}
                          </span>
                        )}
                      </div>
                      {checkIn.journalEntry && (
                        <div className="mt-2 flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {checkIn.journalEntry}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {todayCheckInsDetails.length > 5 && (
                <button
                  onClick={() => setShowAllCheckIns(!showAllCheckIns)}
                  className="w-full text-sm text-muted-foreground text-center pt-2 hover:text-foreground transition-colors"
                >
                  {showAllCheckIns
                    ? "Show less"
                    : `+${todayCheckInsDetails.length - 5} more check-ins today`}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No check-ins yet today.</p>
              <p className="text-sm text-muted-foreground">
                Students will check in when they log in.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                name: "Add Student",
                icon: Users,
                description: "Create new account",
                path: "/admin/students",
              },
              {
                name: "Manage Sprint",
                icon: Calendar,
                description: activeSprint ? "Edit current" : "Create new",
                path: "/admin/sprints",
              },
              {
                name: "Add Objective",
                icon: Target,
                description: "Learning content",
                path: "/admin/objectives",
              },
              {
                name: "Add Book",
                icon: BookOpen,
                description: "Reading library",
                path: "/admin/books",
              },
            ].map((action) => (
              <button
                key={action.name}
                onClick={() => navigate(action.path)}
                className="p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-accent transition-colors text-center group"
              >
                <action.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium block">{action.name}</span>
                <span className="text-xs text-muted-foreground">
                  {action.description}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current sprint info */}
      {activeSprint && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{activeSprint.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(activeSprint.startDate).toLocaleDateString()} -{" "}
                  {new Date(activeSprint.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{sprintDaysLeft}</p>
                <p className="text-sm text-muted-foreground">days left</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminDashboard;
