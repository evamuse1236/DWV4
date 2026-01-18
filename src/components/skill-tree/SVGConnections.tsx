import { useEffect, useState } from "react";
import { generateConnectionPath } from "../../lib/skill-tree-utils";
import { generateHorizontalConnectionPath } from "../../lib/horizontal-tree-utils";
import type { PositionedSkillNode } from "../../lib/skill-tree-utils";
import { cn } from "../../lib/utils";
import styles from "./skill-tree.module.css";

interface SVGConnectionsProps {
  objectives: PositionedSkillNode[];
  subjectPosition: { x: number; y: number };
  isVisible: boolean;
  baseDelay?: number; // Base delay before lines start appearing
  layout?: "radial" | "horizontal";
}

/**
 * SVGConnections - Renders connection lines between nodes
 *
 * Creates quadratic bezier curves between:
 * - Subject node and beginner skill nodes
 * - Parent skill nodes and child skill nodes
 *
 * Features:
 * - Dashed stroke style
 * - Staggered fade-in animation
 * - Curves bow outward from center
 */
export function SVGConnections({
  objectives,
  subjectPosition,
  isVisible,
  baseDelay = 300,
  layout = "radial",
}: SVGConnectionsProps) {
  const [visibleLines, setVisibleLines] = useState<Set<string>>(new Set());

  // Animate lines appearing with stagger
  useEffect(() => {
    if (!isVisible) {
      setVisibleLines(new Set());
      return;
    }

    // Reveal lines one by one
    objectives.forEach((obj, index) => {
      const delay = baseDelay + index * 100;
      setTimeout(() => {
        setVisibleLines(prev => new Set([...prev, obj.id]));
      }, delay);
    });

    return () => {
      setVisibleLines(new Set());
    };
  }, [isVisible, objectives, baseDelay]);

  if (!isVisible || objectives.length === 0) {
    return (
      <svg className={styles['connections-layer']} aria-hidden="true">
        {/* Empty SVG */}
      </svg>
    );
  }

  return (
    <svg className={styles['connections-layer']} aria-hidden="true">
      {objectives.map(obj => {
        // Determine start point (parent position)
        const startPos = obj.parentId === null
          ? subjectPosition // Connect to subject node
          : obj.parentPosition;

        const path = layout === "horizontal"
          ? generateHorizontalConnectionPath(startPos, obj.position)
          : generateConnectionPath(startPos, obj.position);

        const isLineVisible = visibleLines.has(obj.id);

        return (
          <path
            key={`connection-${obj.id}`}
            d={path}
            className={cn(styles['connection-line'], isLineVisible && styles.visible)}
          />
        );
      })}
    </svg>
  );
}

export default SVGConnections;
