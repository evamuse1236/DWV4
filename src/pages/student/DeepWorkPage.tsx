import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { SkillTreeCanvas, DetailsPanel } from "../../components/skill-tree";
import type { Id } from "../../../convex/_generated/dataModel";
import styles from "../../components/skill-tree/skill-tree.module.css";

/**
 * Deep Work Page - Skill Tree Visualization
 *
 * A gamified learning interface showing:
 * - Subject nodes (domains) arranged in a circle
 * - Skill nodes (objectives) branching from subjects
 * - Activity checklist in side panel
 * - Viva request workflow
 */
export function DeepWorkPage() {
  const { user } = useAuth();

  // Selection state
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);

  // Fetch tree data (domains + objectives grouped by domain)
  const treeData = useQuery(
    api.objectives.getTreeData,
    user ? { userId: user._id as Id<"users"> } : "skip"
  );

  // Extract domains and objectives
  const domains = treeData?.domains ?? [];
  const objectivesByDomain = treeData?.objectivesByDomain ?? {};

  // Find selected objective for details panel
  const selectedObjective = useMemo(() => {
    if (!selectedDomainId || !selectedObjectiveId) return null;

    const domainObjectives = objectivesByDomain[selectedDomainId] ?? [];
    return domainObjectives.find(
      (o: any) => o.objective._id === selectedObjectiveId
    ) ?? null;
  }, [selectedDomainId, selectedObjectiveId, objectivesByDomain]);

  // Get selected domain name for panel
  const selectedDomainName = useMemo(() => {
    if (!selectedDomainId) return null;
    return domains.find((d: any) => d._id === selectedDomainId)?.name ?? null;
  }, [selectedDomainId, domains]);

  // Handle objective selection
  const handleSelectObjective = (objective: any | null) => {
    setSelectedObjectiveId(objective?.objective?._id ?? null);
  };

  // Loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-pulse text-2xl mb-2">Loading...</div>
          <p className="text-muted">Please wait while we load your data.</p>
        </div>
      </div>
    );
  }

  if (treeData === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 animate-pulse" />
          <p className="text-muted">Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  // Empty state - no domains configured
  if (domains.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-display mb-4">No Subjects Yet</h2>
          <p className="text-muted">
            Your learning journey hasn't started yet. Check back soon for your
            assigned subjects and objectives.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['deep-work-theme']}>
      <div className={styles['watercolor-bg']}>
        <div className={styles.blob} style={{ width: '500px', height: '500px', background: '#FEF9C3', top: '-10%', left: '-10%' }}></div>
        <div className={styles.blob} style={{ width: '400px', height: '400px', background: '#E0F2F1', bottom: '10%', right: '20%' }}></div>
      </div>

      <div className="page-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 450px', height: '100vh', width: '100%', overflow: 'hidden' }}>
        {/* Left: Skill Tree Canvas */}
        <SkillTreeCanvas
          domains={domains}
          objectivesByDomain={objectivesByDomain}
          selectedDomainId={selectedDomainId}
          selectedObjectiveId={selectedObjectiveId}
          onSelectDomain={setSelectedDomainId}
          onSelectObjective={handleSelectObjective}
        />

        {/* Right: Details Panel */}
        <DetailsPanel
          userId={user._id as Id<"users">}
          domainName={selectedDomainName}
          selectedObjective={selectedObjective}
        />
      </div>
    </div>
  );
}

export default DeepWorkPage;
