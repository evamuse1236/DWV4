import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { SkillTreeCanvas, ObjectivePopover } from "../../components/skill-tree";
import HorizontalTreeCanvas from "../../components/skill-tree/HorizontalTreeCanvas";
import type { Id } from "../../../convex/_generated/dataModel";
import styles from "../../components/skill-tree/skill-tree.module.css";

/**
 * Deep Work Page - Skill Tree Visualization
 *
 * A gamified learning interface showing:
 * - Subject nodes (domains) arranged in a circle for selection
 * - Horizontal branching tree for detailed domain view
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
        majorAssignment: majorEntry.assignment,
        allSubObjectives: majorEntry.subObjectives,
      },
    };
  }, [selectedDomainId, selectedNode, majorsByDomain]);

  // Get selected domain name for popover
  const selectedDomain = useMemo(() => {
    if (!selectedDomainId) return null;
    return domains.find((d: any) => d._id === selectedDomainId) ?? null;
  }, [selectedDomainId, domains]);

  // Clear selection (clicking backdrop)
  const handleClosePanel = () => {
    setSelectedNode(null);
  };

  const handleBackToSubjects = () => {
    setSelectedDomainId(null);
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

        {/* View Switching Logic */}
        {!selectedDomainId ? (
          // Circular View for Selecting a Domain
          <SkillTreeCanvas
            domains={domains}
            majorsByDomain={majorsByDomain}
            selectedDomainId={null} // Force null to keep it in "Subject Selection Mode"
            selectedNode={null}
            onSelectDomain={setSelectedDomainId}
            onSelectNode={() => { }} // No node selection in this view
          />
        ) : (
          // Horizontal View for Exploring Objectives
          selectedDomain && (
            <HorizontalTreeCanvas
              domain={selectedDomain}
              majors={majorsByDomain[selectedDomainId] || []}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onBack={handleBackToSubjects}
            />
          )
        )}

        {/* Right Panel (Details) */}
        <ObjectivePopover
          userId={user._id as Id<"users">}
          domainName={selectedDomain?.name || null}
          selectedNode={selectedNodeDetails}
          onSelectSubObjective={(id) => setSelectedNode({ type: "sub", id })}
        />
      </div>
    </div>
  );
}

export default DeepWorkPage;
