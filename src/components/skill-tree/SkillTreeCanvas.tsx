import { useState, useEffect, useCallback, useMemo } from "react";
import { TreeStructure, Plant, Mountains } from "@phosphor-icons/react";
import SubjectNode from "./SubjectNode";
import SkillNode from "./SkillNode";
import SVGConnections from "./SVGConnections";
import {
  getSubjectPosition,
  calculateSkillTreePositions,
  type PositionedSkillNode,
  CENTER_Y
} from "../../lib/skill-tree-utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";
import styles from "./skill-tree.module.css";

interface Domain {
  _id: Id<"domains">;
  name: string;
}

interface SubObjective {
  _id: Id<"studentObjectives">;
  objectiveId: Id<"learningObjectives">;
  status: string;
  objective: {
    _id: Id<"learningObjectives">;
    title: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    createdAt: number;
  };
  activities: Array<{
    _id: Id<"activities">;
    title: string;
    url: string;
    type: string;
    order: number;
    progress?: { completed: boolean };
  }>;
}

interface MajorObjectiveEntry {
  majorObjective: {
    _id: Id<"majorObjectives">;
    title: string;
    description: string;
    createdAt: number;
  };
  assignment?: {
    _id: Id<"studentMajorObjectives">;
    status: string;
  } | null;
  subObjectives: SubObjective[];
}

interface SelectedNode {
  type: "major" | "sub";
  id: string;
}

interface SkillTreeCanvasProps {
  domains: Domain[];
  majorsByDomain: Record<string, MajorObjectiveEntry[]>;
  selectedDomainId: string | null;
  selectedNode: SelectedNode | null;
  onSelectDomain: (domainId: string | null) => void;
  onSelectNode: (node: SelectedNode | null) => void;
}

/**
 * SkillTreeCanvas - Main skill tree visualization
 * 
 * Modes:
 * 1. Radial Domain Selection (Hub)
 * 2. Horizontal Adventure Map (Skill Tree)
 */
export function SkillTreeCanvas({
  domains,
  majorsByDomain,
  selectedDomainId,
  selectedNode,
  onSelectDomain,
  onSelectNode,
}: SkillTreeCanvasProps) {
  const [positionedNodes, setPositionedNodes] = useState<PositionedSkillNode[]>([]);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [showSkills, setShowSkills] = useState(false);

  const selectedDomain = domains.find(d => d._id === selectedDomainId);

  // Memoize to prevent infinite useEffect loops
  const activeMajors = useMemo(() => {
    return selectedDomainId ? majorsByDomain[selectedDomainId] || [] : [];
  }, [selectedDomainId, majorsByDomain]);

  const subStatusByObjectiveId = useMemo(() => {
    const map = new Map<string, { status: string; completed: boolean }>();
    activeMajors.forEach((major) => {
      major.subObjectives.forEach((sub) => {
        const completed =
          sub.activities.length === 0 ||
          sub.activities.every((activity) => activity.progress?.completed);
        map.set(sub.objective._id.toString(), {
          status: completed ? "completed" : sub.status,
          completed,
        });
      });
    });
    return map;
  }, [activeMajors]);

  const majorStatusById = useMemo(() => {
    const map = new Map<string, { status: string; isReady: boolean; hasActiveWork: boolean }>();
    activeMajors.forEach((major) => {
      const completedCount = major.subObjectives.filter((sub) => {
        const record = subStatusByObjectiveId.get(sub.objective._id.toString());
        return record?.completed;
      }).length;
      const total = major.subObjectives.length;
      const hasActiveWork = major.subObjectives.some((sub) => {
        const record = subStatusByObjectiveId.get(sub.objective._id.toString());
        return record?.status === "in_progress" || record?.status === "completed";
      });
      map.set(major.majorObjective._id.toString(), {
        status: major.assignment?.status || "assigned",
        isReady: total > 0 && completedCount === total,
        hasActiveWork,
      });
    });
    return map;
  }, [activeMajors, subStatusByObjectiveId]);

  const [expandedMajorId, setExpandedMajorId] = useState<string | null>(null);

  const visibleSubMajorIds = useMemo(() => {
    const ids = new Set<string>();
    if (expandedMajorId) ids.add(expandedMajorId);
    
    majorStatusById.forEach((status, majorId) => {
      if (status.hasActiveWork) ids.add(majorId);
    });

    if (selectedNode?.type === "sub") {
      activeMajors.forEach((major) => {
        const hasSelectedSub = major.subObjectives.some(
          (sub) => sub.objective._id.toString() === selectedNode.id
        );
        if (hasSelectedSub) {
          ids.add(major.majorObjective._id.toString());
        }
      });
    }
    return ids;
  }, [expandedMajorId, majorStatusById, selectedNode, activeMajors]);

  useEffect(() => {
    if (!selectedDomainId || !selectedDomain) {
      setShowSkills(false);
      setPositionedNodes([]);
      setCanvasWidth(800); // Default radial width
      return;
    }

    const domainIndex = domains.findIndex(d => d._id === selectedDomainId);
    const { angle } = getSubjectPosition(domainIndex, domains.length);

    const majorsForPositioning = activeMajors.map((entry) => ({
      _id: entry.majorObjective._id,
      title: entry.majorObjective.title,
      description: entry.majorObjective.description,
      createdAt: entry.majorObjective.createdAt,
      subObjectives: entry.subObjectives.map((sub) => ({
        _id: sub.objective._id,
        title: sub.objective.title,
        description: sub.objective.description,
        difficulty: sub.objective.difficulty,
        createdAt: sub.objective.createdAt,
      })),
    }));

    // Use Adventure Map Layout
    const { nodes, width } = calculateSkillTreePositions(majorsForPositioning, angle);
    setPositionedNodes(nodes);
    setCanvasWidth(Math.max(width, window.innerWidth)); // Ensure full screen fill

    const timer = setTimeout(() => {
      setShowSkills(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedDomainId, selectedDomain, activeMajors, domains]);

  const handleSubjectClick = useCallback(
    (domainId: string) => {
      if (selectedDomainId === domainId) return;
      onSelectDomain(domainId);
      onSelectNode(null);
    },
    [selectedDomainId, onSelectDomain, onSelectNode]
  );

  const handleMajorClick = useCallback(
    (majorId: string) => {
      const node = { type: "major" as const, id: majorId };
      onSelectNode(node);
      setExpandedMajorId((prev) => (prev === majorId ? null : majorId));
    },
    [onSelectNode]
  );

  const handleSubClick = useCallback(
    (subObjectiveId: string) => {
      const node = { type: "sub" as const, id: subObjectiveId };
      onSelectNode(node);
    },
    [onSelectNode]
  );

  const handleBack = useCallback(() => {
    setShowSkills(false);
    onSelectDomain(null);
    onSelectNode(null);
  }, [onSelectDomain, onSelectNode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, type: "subject" | "major" | "sub", id: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (type === "subject") handleSubjectClick(id);
        else if (type === "major") handleMajorClick(id);
        else handleSubClick(id);
      } else if (e.key === "Escape" && selectedDomainId) {
        handleBack();
      }
    },
    [handleSubjectClick, handleMajorClick, handleSubClick, handleBack, selectedDomainId]
  );

  // Subject Position in Adventure Mode
  const adventureSubjectPos = { x: 100, y: CENTER_Y };

  return (
    <div className={styles['spiral-stage']}>
      <button
        type="button"
        className={cn(styles['back-btn'], selectedDomainId && styles.visible)}
        onClick={handleBack}
        aria-label="Back to subjects"
      >
        <span className="text-lg">←</span> Back to Map
      </button>

      <div 
        className={styles['spiral-container']} 
        style={{ width: selectedDomainId ? `${canvasWidth}px` : '100%' }}
      >
        {/* Biome Backgrounds - Only visible in Adventure Mode */}
        {selectedDomainId && (
          <div className={styles['biome-layer']}>
            <div className={cn(styles['biome-zone'], styles['biome-beginner'])}>
              <Plant weight="duotone" className={styles['biome-icon']} />
              <div className={styles['biome-label']}>Grassy Plains</div>
            </div>
            <div className={cn(styles['biome-zone'], styles['biome-intermediate'])}>
              <TreeStructure weight="duotone" className={styles['biome-icon']} />
              <div className={styles['biome-label']}>Misty Forest</div>
            </div>
            <div className={cn(styles['biome-zone'], styles['biome-advanced'])}>
              <Mountains weight="duotone" className={styles['biome-icon']} />
              <div className={styles['biome-label']}>Crystal Peaks</div>
            </div>
          </div>
        )}

        <SVGConnections
          objectives={positionedNodes.filter(
            (node) =>
              node.type === "major" ||
              (node.parentId && visibleSubMajorIds.has(node.parentId))
          )}
          subjectPosition={selectedDomainId ? adventureSubjectPos : { x: 400, y: 400 }}
          isVisible={showSkills}
        />

        {domains.map((domain, index) => {
          const originalPosition = getSubjectPosition(index, domains.length);
          const isSelected = selectedDomainId === domain._id;
          const isFaded = selectedDomainId !== null && !isSelected;

          // In Adventure Mode, selected subject moves to start of path
          const position = isSelected 
            ? { x: 100, y: CENTER_Y, angle: 0 } 
            : originalPosition;

          return (
            <SubjectNode
              key={domain._id}
              id={domain._id}
              name={domain.name}
              position={position}
              isSelected={isSelected}
              isFaded={isFaded}
              onClick={() => handleSubjectClick(domain._id)}
              onKeyDown={e => handleKeyDown(e, "subject", domain._id)}
            />
          );
        })}

        {showSkills &&
          positionedNodes.map((node, index) => {
            if (node.type === "major") {
              const majorState = majorStatusById.get(node.id);
              const isExpanded = visibleSubMajorIds.has(node.id);
              return (
                <SkillNode
                  key={node.id}
                  id={node.id}
                  title={node.title}
                  position={node.position}
                  isActive={selectedNode?.type === "major" && selectedNode.id === node.id}
                  isVisible={showSkills}
                  delay={Math.min(index * 30, 500)}
                  variant="major"
                  status={majorState?.status}
                  isReady={majorState?.isReady}
                  isExpanded={isExpanded}
                  onClick={() => handleMajorClick(node.id)}
                  onKeyDown={e => handleKeyDown(e, "major", node.id)}
                />
              );
            }

            if (!node.parentId || !visibleSubMajorIds.has(node.parentId)) {
              return null;
            }

            const subState = subStatusByObjectiveId.get(node.id);
            return (
              <SkillNode
                key={node.id}
                id={node.id}
                title={node.title}
                position={node.position}
                isActive={selectedNode?.type === "sub" && selectedNode.id === node.id}
                isVisible={showSkills}
                delay={Math.min(index * 30, 500)}
                difficulty={node.difficulty}
                variant="sub"
                status={subState?.status}
                onClick={() => handleSubClick(node.id)}
                onKeyDown={e => handleKeyDown(e, "sub", node.id)}
              />
            );
          })}
      </div>
    </div>
  );
}

export default SkillTreeCanvas;