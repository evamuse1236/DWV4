import { Code, Function, BookOpen, Star } from "@phosphor-icons/react";
import { SUBJECT_NODE_SIZE, getDomainConfig } from "../../lib/skill-tree-utils";
import { cn } from "../../lib/utils";
import styles from "./skill-tree.module.css";

/**
 * Icon components mapped by name
 */
const iconMap: Record<string, typeof Star> = {
  Code,
  Function,
  BookOpen,
  Star,
};

interface SubjectNodeProps {
  id: string;
  name: string;
  position: { x: number; y: number };
  isSelected: boolean;
  isFaded: boolean;
  onClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * SubjectNode - Domain/subject node in the skill tree
 *
 * 120x120px rounded node that:
 * - Displays domain icon and name
 * - Centers when selected, fades others
 * - Uses pastel colors based on domain
 * - Supports keyboard navigation
 */
export function SubjectNode({
  id,
  name,
  position,
  isSelected,
  isFaded,
  onClick,
  onKeyDown,
}: SubjectNodeProps) {
  const config = getDomainConfig(name);

  // Get the icon component
  const IconComponent = iconMap[config.iconName] || iconMap.Star;

  // Build CSS classes using module
  const classes = cn(
    styles['node-base'],
    styles['subject-node'],
    styles[config.colorClass as keyof typeof styles],
    isSelected && styles.centered,
    isFaded && styles.faded
  );

  // CSS for positioning (centered on position)
  const style: React.CSSProperties = {
    left: `${position.x - SUBJECT_NODE_SIZE / 2}px`,
    top: `${position.y - SUBJECT_NODE_SIZE / 2}px`,
  };

  return (
    <div
      className={classes}
      style={style}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={isFaded ? -1 : 0}
      role="button"
      aria-label={`${name} subject`}
      aria-pressed={isSelected}
      data-subject-id={id}
    >
      <IconComponent size={32} weight="regular" />
      <div>{name}</div>
    </div>
  );
}

export default SubjectNode;
