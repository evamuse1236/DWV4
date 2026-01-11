import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";

// Domain color classes based on name
const getDomainColorClass = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("math")) return "pastel-purple";
  if (lowerName.includes("writ")) return "pastel-green";
  if (lowerName.includes("code") || lowerName.includes("coding")) return "pastel-pink";
  if (lowerName.includes("read")) return "pastel-blue";
  if (lowerName.includes("science")) return "pastel-orange";
  return "pastel-yellow";
};

/**
 * Student Dashboard - Paper UI Bento Grid Design
 * Main landing page with artful glass cards
 */
export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get domains from database
  const domains = useQuery(api.domains.getAll);

  // Get active sprint
  const activeSprint = useQuery(api.sprints.getActive);

  // Get goals for active sprint
  const goals = useQuery(
    api.goals.getByUserAndSprint,
    activeSprint && user
      ? { userId: user._id as any, sprintId: activeSprint._id }
      : "skip"
  );

  // Get deep work progress
  const domainProgress = useQuery(
    api.progress.getDomainSummary,
    user ? { userId: user._id as any } : "skip"
  );

  // Get currently reading book
  const currentBook = useQuery(
    api.books.getCurrentlyReading,
    user ? { userId: user._id as any } : "skip"
  );

  // Calculate sprint day
  const sprintDay = activeSprint
    ? Math.ceil(
        (Date.now() - new Date(activeSprint.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // Calculate tasks left
  const tasksLeft = goals?.filter((g: any) => g.status !== "completed").length || 0;

  // Calculate total mastered
  const totalMastered = domainProgress?.reduce((sum: number, p: any) => sum + p.mastered, 0) || 0;

  // Find most relevant domain: prioritize in-progress, then assigned/not-started, then by incomplete count
  const getMostRelevantDomainPath = () => {
    if (!domainProgress || domainProgress.length === 0) return "/deep-work";

    // First, find domain with in-progress work
    const inProgressDomain = domainProgress.find((p: any) => p.inProgress > 0);
    if (inProgressDomain) return `/deep-work/${inProgressDomain.domain._id}`;

    // Next, find domain with assigned but not-started work
    const assignedDomain = domainProgress.find((p: any) => p.assigned > 0);
    if (assignedDomain) return `/deep-work/${assignedDomain.domain._id}`;

    // Finally, find domain with most incomplete objectives
    const sortedByIncomplete = [...domainProgress]
      .filter((p: any) => p.total > 0 && p.total > p.mastered)
      .sort((a: any, b: any) => (b.total - b.mastered) - (a.total - a.mastered));

    if (sortedByIncomplete.length > 0) {
      return `/deep-work/${sortedByIncomplete[0].domain._id}`;
    }

    return "/deep-work";
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.displayName?.split(" ")[0] || "there";

  return (
    <div>
      {/* Artful Header */}
      <div className="fade-in-up mb-[60px]">
        <div className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] mb-5 font-body">
          The Daily Overview
        </div>
        <h1 className="text-[4rem] mt-[-10px] leading-[1.1]">
          {getGreeting()},<br />
          <span className="text-[#6b7280] not-italic text-[0.8em]">{firstName}.</span>
        </h1>
      </div>

      {/* Bento Grid */}
      <div className="bento-grid fade-in-up delay-1">
        {/* Main Focus Card - Deep Work - routes to most relevant domain */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="pastel-card pastel-orange col-span-2 row-span-2 p-10 flex flex-col justify-between cursor-pointer"
          onClick={() => navigate(getMostRelevantDomainPath())}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[3rem] m-0">Deep Work</h3>
              <p className="font-body opacity-70 mt-2">Find your flow state.</p>
            </div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.6)",
                backdropFilter: "blur(5px)",
              }}
            >
              <svg className="w-7 h-7 text-[#c2410c]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div className="font-display text-[80px] italic leading-none">
            {totalMastered > 0 ? `${totalMastered}` : "0"}
            <span className="text-[0.3em] not-italic opacity-50 ml-2">mastered</span>
          </div>
        </motion.div>

        {/* Sprint Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="pastel-card pastel-blue p-[30px] cursor-pointer flex flex-col"
          onClick={() => navigate("/sprint")}
        >
          <div className="flex justify-between mb-5">
            <svg className="w-7 h-7 opacity-60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
            </svg>
            <span className="font-display italic text-[20px]">
              {activeSprint ? `Day ${sprintDay}` : "—"}
            </span>
          </div>
          <h3 className="mb-auto">{activeSprint?.name || "No Sprint"}</h3>
          <div>
            <span className="text-[12px] uppercase tracking-[0.1em] opacity-60">
              {tasksLeft} Tasks Left
            </span>
          </div>
        </motion.div>

        {/* Reading Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="pastel-card pastel-yellow p-[30px] cursor-pointer flex flex-col"
          onClick={() => navigate("/reading")}
        >
          <div className="flex justify-between mb-5">
            <svg className="w-7 h-7 opacity-60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="mb-auto">
            {currentBook?.book?.title || "Start a Book"}
          </h3>
          <div>
            <span className="text-[12px] uppercase tracking-[0.1em] opacity-60">
              {currentBook?.book?.author || "Browse the library"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Domains Row */}
      {domains && domains.length > 0 && (
        <div className="mt-[60px] fade-in-up delay-2">
          <div className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] mb-6 font-body">
            Active Domains
          </div>
          <div className="grid grid-cols-4 gap-6">
            {domains.map((domain: any) => {
              const progress = domainProgress?.find(
                (p: any) => p.domain?._id === domain._id
              );

              return (
                <motion.div
                  key={domain._id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`pastel-card ${getDomainColorClass(domain.name)} h-[140px] p-6 flex flex-col justify-center items-center text-center cursor-pointer`}
                  onClick={() => navigate(`/deep-work/${domain._id}`)}
                >
                  <div className="opacity-60 mb-3 text-3xl">
                    {domain.icon}
                  </div>
                  <h3 className="text-[24px] m-0">{domain.name}</h3>
                  {progress && progress.total > 0 && (
                    <span className="text-[11px] uppercase tracking-[0.1em] opacity-50 mt-1">
                      {progress.mastered}/{progress.total}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Note: Check-in reminder removed - gate enforces check-in before dashboard access */}
    </div>
  );
}

export default StudentDashboard;
