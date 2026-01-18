import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { SkillTreeCanvas, ObjectivePopover } from "../../components/skill-tree";
import type { Id } from "../../../convex/_generated/dataModel";
import styles from "../../components/skill-tree/skill-tree.module.css";

/**
 * Deep Work Page - Skill Tree Visualization
 *
 * A gamified learning interface showing:
 * - Subject nodes (domains) arranged in a circle
 * - Skill nodes (objectives) branching from subjects
 * - Activity checklist in left panel
 * - Viva request workflow
 */
export function DeepWorkPage() {
  const { user } = useAuth();

  // Selection state
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ type: "major" | "sub"; id: string } | null>(null);

  // Fetch tree data (domains + objectives grouped by domain)
  const treeData = useQuery(
    api.objectives.getTreeData,
    user ? { userId: user._id as Id<"users"> } : "skip"
  );

  // Extract domains and objectives
  const domains = treeData?.domains ?? [];
  const majorsByDomain = treeData?.majorsByDomain ?? {};

  const selectedNodeDetails = useMemo(() => {
    if (!selectedDomainId || !selectedNode) return null;

    const domainMajors = majorsByDomain[selectedDomainId] ?? [];

    if (selectedNode.type === "major") {
      const entry = domainMajors.find(
        (major: any) => major.majorObjective._id === selectedNode.id
      );
      return entry
        ? { type: "major" as const, data: entry }
        : null;
    }

    const majorEntry = domainMajors.find((major: any) =>
      major.subObjectives.some(
        (sub: any) => sub.objective._id === selectedNode.id
      )
    );

    if (!majorEntry) return null;
    const subObjective = majorEntry.subObjectives.find(
      (sub: any) => sub.objective._id === selectedNode.id
    );

    if (!subObjective) return null;

    return {
      type: "sub" as const,
      data: {
        majorObjective: majorEntry.majorObjective,
        subObjective,
      },
    };
  }, [selectedDomainId, selectedNode, majorsByDomain]);

  // Get selected domain name for popover
  const selectedDomainName = useMemo(() => {
    if (!selectedDomainId) return null;
    return domains.find((d: any) => d._id === selectedDomainId)?.name ?? null;
  }, [selectedDomainId, domains]);

  // Handle objective selection (position no longer needed)
  const handleSelectNode = (
    node: { type: "major" | "sub"; id: string } | null
  ) => {
    setSelectedNode(node);
  };

  // Handle panel close (clicking backdrop)
  const handleClosePanel = () => {
    setSelectedNode(null);
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

  // Whether panel is open (node selected)
  const isPanelOpen = selectedNode !== null;

  return (
    <div className={styles['deep-work-theme']}>
      <div className={styles['watercolor-bg']}>
        <div className={styles.blob} style={{ width: '500px', height: '500px', background: '#FEF9C3', top: '-10%', left: '-10%' }}></div>
        <div className={styles.blob} style={{ width: '400px', height: '400px', background: '#E0F2F1', bottom: '10%', right: '20%' }}></div>
      </div>

      <div className="w-full h-screen overflow-hidden relative">
        {/* Backdrop - click to close panel */}
        {isPanelOpen && (
          <div
            className={styles['canvas-backdrop']}
            onClick={handleClosePanel}
            aria-label="Close panel"
          />
        )}

        {/* Skill Tree Canvas */}
        <SkillTreeCanvas
          domains={domains}
          majorsByDomain={majorsByDomain}
          selectedDomainId={selectedDomainId}
          selectedNode={selectedNode}
          onSelectDomain={setSelectedDomainId}
          onSelectNode={handleSelectNode}
        />

        {/* Left Panel (Details) */}
        <ObjectivePopover
          userId={user._id as Id<"users">}
          domainName={selectedDomainName}
          selectedNode={selectedNodeDetails}
          onClose={handleClosePanel}
        />
      </div>
    </div>
  );
}

export default DeepWorkPage;
