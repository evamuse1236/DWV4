import { useEffect, useState } from "react";
import {
  TerminalWindow,
  ArrowsClockwise,
  GitBranch,
  Globe,
  PlusMinus,
  ChartPieSlice,
  X,
  UsersThree,
  Feather,
  TextAUnderline,
  Star,
} from "@phosphor-icons/react";
import { SKILL_NODE_SIZE } from "../../lib/skill-tree-utils";
import { cn } from "../../lib/utils";
import styles from "./skill-tree.module.css";

/**
 * Icon mapping for skill nodes
 * Maps icon names to Phosphor icon components
 */
const iconMap: Record<string, typeof Star> = {
  TerminalWindow,
  ArrowsClockwise,
  GitBranch,
  Globe,
  PlusMinus,
  ChartPieSlice,
  X,
  UsersThree,
  Feather,
  TextAUnderline,
  Star,
};

interface SkillNodeProps {
  id: string;
  title: string;
  position: { x: number; y: number };
  isActive: boolean;
  isVisible: boolean;
  delay: number; // Stagger animation delay in ms
  difficulty: string;
  onClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * SkillNode - Individual skill/objective node in the tree
 *
 * 60x60px rounded node that:
 * - Displays an icon based on difficulty or title
 * - Has staggered fade-in animation
 * - Shows active state when selected
 * - Supports keyboard navigation
 */
export function SkillNode({
  id,
  title,
  position,
  isActive,
  isVisible,
  delay,
  difficulty,
  onClick,
  onKeyDown,
}: SkillNodeProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Trigger visibility animation after delay
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [isVisible, delay]);

  // Choose icon based on title keywords or difficulty
  const getIcon = () => {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes("python") || lowerTitle.includes("code")) {
      const Icon = iconMap.TerminalWindow;
      return <Icon size={24} weight="regular" />;
    }
    if (lowerTitle.includes("loop")) {
      const Icon = iconMap.ArrowsClockwise;
      return <Icon size={24} weight="regular" />;
    }
    if (lowerTitle.includes("logic") || lowerTitle.includes("condition")) {
      const Icon = iconMap.GitBranch;
      return <Icon size={24} weight="regular" />;
    }
    if (lowerTitle.includes("web") || lowerTitle.includes("html")) {
      const Icon = iconMap.Globe;
      return <Icon size={24} weight="regular" />;
    }
    if (lowerTitle.includes("integer") || lowerTitle.includes("number")) {
      const Icon = iconMap.PlusMinus;
      return <Icon size={24} weight="regular" />;
    }
    if (lowerTitle.includes("fraction")) {
      const Icon = iconMap.ChartPieSlice;
      return <Icon size={24} weight="regular" />;
    }
    if (lowerTitle.includes("algebra") || lowerTitle.includes("equation")) {
      const Icon = iconMap.X;
      return <Icon size={24} weight="regular" />;
    }
    if (lowerTitle.includes("read") || lowerTitle.includes("book")) {
      const Icon = iconMap.UsersThree;
      return <Icon size={24} weight="regular" />;
    }
    if (lowerTitle.includes("poetry") || lowerTitle.includes("poem")) {
      const Icon = iconMap.Feather;
      return <Icon size={24} weight="regular" />;
    }
    if (lowerTitle.includes("grammar") || lowerTitle.includes("writing")) {
      const Icon = iconMap.TextAUnderline;
      return <Icon size={24} weight="regular" />;
    }

    // Default icon
    const Icon = iconMap.Star;
    return <Icon size={24} weight="regular" />;
  };

  // CSS for positioning (centered on position)
  const style: React.CSSProperties = {
    left: `${position.x - SKILL_NODE_SIZE / 2}px`,
    top: `${position.y - SKILL_NODE_SIZE / 2}px`,
    transitionDelay: `${delay}ms`,
  };

  return (
    <div
      className={cn(styles['node-base'], styles['skill-node'], shouldAnimate && styles.visible, isActive && styles.active)}
      style={style}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${title} skill, ${difficulty} difficulty`}
      aria-pressed={isActive}
      data-skill-id={id}
    >
      {getIcon()}
    </div>
  );
}

export default SkillNode;
