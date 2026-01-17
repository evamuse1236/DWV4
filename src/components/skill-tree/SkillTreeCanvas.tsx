import { useState, useEffect, useCallback } from "react";
import SubjectNode from "./SubjectNode";
import SkillNode from "./SkillNode";
import SVGConnections from "./SVGConnections";
import {
  getSubjectPosition,
  getDomainConfig,
  calculateSkillPositions,
  type PositionedObjective,
} from "../../lib/skill-tree-utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";
import styles from "./skill-tree.module.css";

interface Domain {
  _id: Id<"domains">;
  name: string;
}

interface Objective {
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

interface SkillTreeCanvasProps {
  domains: Domain[];
  objectivesByDomain: Record<string, Objective[]>;
  selectedDomainId: string | null;
  selectedObjectiveId: string | null;
  onSelectDomain: (domainId: string | null) => void;
  onSelectObjective: (objective: Objective | null) => void;
}

/**
 * SkillTreeCanvas - Main skill tree visualization
 *
 * Orchestrates:
 * - Subject nodes in a circle around center
 * - Skill nodes branching from selected subject
 * - Connection lines between nodes
 * - Selection and animation states
 * - Keyboard navigation
 */
export function SkillTreeCanvas({
  domains,
  objectivesByDomain,
  selectedDomainId,
  selectedObjectiveId,
  onSelectDomain,
  onSelectObjective,
}: SkillTreeCanvasProps) {
  const [positionedObjectives, setPositionedObjectives] = useState<PositionedObjective[]>([]);
  const [showSkills, setShowSkills] = useState(false);

  // Get selected domain
  const selectedDomain = domains.find(d => d._id === selectedDomainId);

  // Calculate skill positions when domain is selected
  useEffect(() => {
    if (!selectedDomainId || !selectedDomain) {
      setShowSkills(false);
      setPositionedObjectives([]);
      return;
    }

    const objectives = objectivesByDomain[selectedDomainId] || [];
    const domainConfig = getDomainConfig(selectedDomain.name);

    // Map to format expected by calculateSkillPositions
    const objectivesForPositioning = objectives.map(o => ({
      _id: o.objective._id,
      title: o.objective.title,
      description: o.objective.description,
      difficulty: o.objective.difficulty,
      createdAt: o.objective.createdAt,
    }));

    const positioned = calculateSkillPositions(objectivesForPositioning, domainConfig.angle);
    setPositionedObjectives(positioned);

    // Delay showing skills for animation
    const timer = setTimeout(() => {
      setShowSkills(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [selectedDomainId, selectedDomain, objectivesByDomain]);

  // Handle subject click
  const handleSubjectClick = useCallback(
    (domainId: string) => {
      if (selectedDomainId === domainId) return; // Already selected
      onSelectDomain(domainId);
      onSelectObjective(null); // Clear objective selection
    },
    [selectedDomainId, onSelectDomain, onSelectObjective]
  );

  // Handle skill click
  const handleSkillClick = useCallback(
    (objectiveId: string) => {
      if (!selectedDomainId) return;

      const objectives = objectivesByDomain[selectedDomainId] || [];
      const objective = objectives.find(o => o.objective._id === objectiveId);
      onSelectObjective(objective || null);
    },
    [selectedDomainId, objectivesByDomain, onSelectObjective]
  );

  // Handle back button
  const handleBack = useCallback(() => {
    setShowSkills(false);
    onSelectDomain(null);
    onSelectObjective(null);
  }, [onSelectDomain, onSelectObjective]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, type: "subject" | "skill", id: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (type === "subject") {
          handleSubjectClick(id);
        } else {
          handleSkillClick(id);
        }
      } else if (e.key === "Escape" && selectedDomainId) {
        handleBack();
      }
    },
    [handleSubjectClick, handleSkillClick, handleBack, selectedDomainId]
  );

  // Get subject position for connections
  const subjectPosition = selectedDomain
    ? getSubjectPosition(selectedDomain.name)
    : { x: 400, y: 400 };

  return (
    <div className={styles['spiral-stage']}>
      {/* Back Button */}
      <button
        className={cn(styles['back-btn'], selectedDomainId && styles.visible)}
        onClick={handleBack}
        aria-label="Back to subjects"
      >
        ← Back to Subjects
      </button>

      {/* Tree Container */}
      <div className={styles['spiral-container']}>
        {/* Connection Lines */}
        <SVGConnections
          objectives={positionedObjectives}
          subjectPosition={subjectPosition}
          isVisible={showSkills}
        />

        {/* Subject Nodes */}
        {domains.map(domain => {
          const position = getSubjectPosition(domain.name);
          const isSelected = selectedDomainId === domain._id;
          const isFaded = selectedDomainId !== null && !isSelected;

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

        {/* Skill Nodes */}
        {showSkills &&
          positionedObjectives.map((obj, index) => (
            <SkillNode
              key={obj.id}
              id={obj.id}
              title={obj.title}
              position={obj.position}
              isActive={selectedObjectiveId === obj.id}
              isVisible={showSkills}
              delay={index * 100}
              difficulty={obj.difficulty}
              onClick={() => handleSkillClick(obj.id)}
              onKeyDown={e => handleKeyDown(e, "skill", obj.id)}
            />
          ))}
      </div>
    </div>
  );
}

export default SkillTreeCanvas;
