import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SkillTreeCanvas, ObjectivePopover } from "@/features/deep-work/components/skill-tree";
import HorizontalTreeCanvas from "@/features/deep-work/components/skill-tree/HorizontalTreeCanvas";
import type { Id } from "@convex/_generated/dataModel";
import styles from "@/features/deep-work/components/skill-tree/skill-tree.module.css";

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
  const { user, token } = useAuth();

  // Selection state
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ type: "major" | "sub"; id: string } | null>(null);

  // Fetch tree data (domains + objectives grouped by domain)
  const treeData = useQuery(
    api.objectives.getTreeData,
    user && token ? { token, userId: user._id as Id<"users"> } : "skip"
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
  if (!user || !token || treeData === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden
            className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-divider)] border-t-[var(--color-espresso)]"
          />
          <p className="font-display text-lg italic text-[var(--color-taupe)]">
            Mapping your learning journey…
          </p>
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
          token={token}
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
