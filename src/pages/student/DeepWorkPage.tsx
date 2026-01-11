import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import {
  getDomainIcon,
  getDomainColorClass,
  getDomainDescription,
} from "../../lib/domain-utils";

/**
 * Deep Work Page - Paper UI Design
 * Hero glass section with stats and domain grid
 */
export function DeepWorkPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get all domains
  const domains = useQuery(api.domains.getAll);

  // Get student's progress summary
  const progressSummary = useQuery(
    api.progress.getDomainSummary,
    user ? { userId: user._id as any } : "skip"
  );

  // Create a map of domain progress
  interface DomainProgress {
    domain: any;
    total: number;
    mastered: number;
    inProgress: number;
    assigned: number;
  }
  const progressMap = new Map<string, DomainProgress>(
    progressSummary?.map((p: any) => [p.domain._id, p]) || []
  );

  // Calculate total stats
  const totalMastered = progressSummary?.reduce((sum: number, p: any) => sum + p.mastered, 0) || 0;
  const totalInProgress = progressSummary?.reduce((sum: number, p: any) => sum + p.inProgress, 0) || 0;



  return (
    <div>
      {/* Header */}
      <div className="fade-in-up text-center mb-10">
        <span className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] block mb-3 font-body">
          Your Learning Journey
        </span>
        <h1 className="text-[4rem] m-0 leading-none">Deep Work</h1>
      </div>

      {/* Hero Glass Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="fade-in-up delay-1 mb-[60px] relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.9)",
          borderRadius: "40px",
          padding: "60px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Radial glow overlay */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background: "radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)",
            opacity: 0.5,
          }}
        />

        <h2 className="font-display text-[32px] italic text-[#555] mb-10 relative z-10">
          What will you master today?
        </h2>

        {/* Play Button */}
        <button
          onClick={() => {
            // Navigate to first domain with objectives
            const firstDomain = domains?.[0];
            if (firstDomain) {
              navigate(`/deep-work/${firstDomain._id}`);
            }
          }}
          className="breathing-glow relative z-10"
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border: "none",
            background: "#1a1a1a",
            color: "white",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.3s",
          }}
        >
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        {/* Stats */}
        <div className="mt-10 flex justify-center gap-10 relative z-10">
          <div>
            <span className="font-display text-[48px] block leading-none">{totalMastered}</span>
            <span className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888]">Topics Mastered</span>
          </div>
          <div className="w-px h-[50px] bg-black/10" />
          <div>
            <span className="font-display text-[48px] block leading-none">{totalInProgress}</span>
            <span className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888]">In Progress</span>
          </div>
        </div>
      </motion.div>

      {/* Knowledge Gardens */}
      <div className="fade-in-up delay-2">
        <div className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] mb-6 font-body">
          Knowledge Gardens
        </div>
        <div className="grid grid-cols-2 gap-8">
          {domains?.map((domain: any, index: number) => {
            const progress = progressMap.get(domain._id);

            return (
              <motion.div
                key={domain._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`pastel-card ${getDomainColorClass(domain.name)} p-8 flex items-start justify-between cursor-pointer`}
                onClick={() => navigate(`/deep-work/${domain._id}`)}
              >
                <div>
                  <h3>{domain.name}</h3>
                  <div className="mt-3 font-body text-[13px] opacity-70 leading-relaxed">
                    {getDomainDescription(domain.name)}<br />
                    <strong>
                      {progress?.mastered || 0}/{progress?.total || 0} Modules
                    </strong>
                  </div>
                </div>
                <div className="w-12 h-12 opacity-20">
                  {getDomainIcon(domain.name)}
                </div>
              </motion.div>
            );
          })}

          {/* Empty state placeholder domains */}
          {(!domains || domains.length === 0) && (
            <>
              <div className="pastel-card pastel-purple p-8 opacity-50">
                <h3>Mathematics</h3>
                <div className="mt-3 font-body text-[13px] opacity-70">
                  Coming soon...
                </div>
              </div>
              <div className="pastel-card pastel-green p-8 opacity-50">
                <h3>Literature</h3>
                <div className="mt-3 font-body text-[13px] opacity-70">
                  Coming soon...
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* The Ritual */}
      <div className="fade-in-up delay-3 mt-20 max-w-[600px] mx-auto">
        <div className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] text-center mb-10 font-body">
          The Ritual
        </div>

        <div className="ritual-step">
          <div className="ritual-number">1</div>
          <div>
            <h4 className="font-display text-[24px] mb-2">Set Intention</h4>
            <p className="text-[14px] text-muted">
              Choose a domain and define a clear goal for this session.
            </p>
          </div>
        </div>

        <div className="ritual-step">
          <div className="ritual-number">2</div>
          <div>
            <h4 className="font-display text-[24px] mb-2">Deep Dive</h4>
            <p className="text-[14px] text-muted">
              Eliminate distractions. Immerse yourself in the material for 25 minutes.
            </p>
          </div>
        </div>

        <div className="ritual-step">
          <div className="ritual-number">3</div>
          <div>
            <h4 className="font-display text-[24px] mb-2">Mastery</h4>
            <p className="text-[14px] text-muted">
              Complete the quiz or viva to lock in your knowledge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeepWorkPage;
