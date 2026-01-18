import type { Id } from "../../convex/_generated/dataModel";

/**
 * Skill Tree positioning and configuration utilities
 * Handles Adventure Map layout calculations (Horizontal scroll)
 */

// Canvas settings
export const CANVAS_HEIGHT = 600;
export const CANVAS_PADDING = 100;
export const CENTER_Y = CANVAS_HEIGHT / 2;

// Subject distance from center (for Radial Menu)
export const SUBJECT_DISTANCE = 180;
export const CENTER = { x: 400, y: 400 };

// Node sizes
export const SUBJECT_NODE_SIZE = 120;
export const MAJOR_NODE_SIZE = 100; // Larger for hierarchy
export const SUB_NODE_SIZE = 60;    // Organic shape size

// Spacing constants
export const VERTICAL_SPREAD = 85;
export const MIN_GAP_BETWEEN_MAJORS = 200;
export const SUB_NODE_X_SPREAD = 60; // Horizontal spread for fan

// Biome Colors
export const BIOME_COLORS = {
  beginner: "#ecfdf5",     // Grassy Plains
  intermediate: "#fffbeb", // Misty Forest
  advanced: "#eff6ff"      // Crystal Peaks
};

// Domain configuration with angles, colors, and icons
export interface DomainConfig {
  color: string;
  colorClass: string;
  iconName: string;
}

/**
 * Get domain configuration based on domain name
 */
export function getDomainConfig(domainName: string): DomainConfig {
  const name = domainName.toLowerCase();

  if (name.includes("cod") || name.includes("engineer") || name.includes("programming")) {
    return { color: "var(--skill-col-coding)", colorClass: "subject-coding", iconName: "Code" };
  }
  if (name.includes("math")) {
    return { color: "var(--skill-col-maths)", colorClass: "subject-maths", iconName: "Function" };
  }
  if (name.includes("read") || name.includes("liter") || name.includes("book")) {
    return { color: "var(--skill-col-reading)", colorClass: "subject-reading", iconName: "BookOpen" };
  }
  if (name.includes("writ") || name.includes("essay") || name.includes("composition")) {
    return { color: "var(--skill-col-writing)", colorClass: "subject-writing", iconName: "Star" };
  }
  return { color: "#f3f4f6", colorClass: "", iconName: "Star" };
}

/**
 * Objective with calculated position
 */
export interface PositionedSkillNode {
  id: string;
  type: "major" | "sub";
  title: string;
  description: string;
  difficulty?: string;
  position: { x: number; y: number };
  parentPosition: { x: number; y: number };
  parentId: string | null;
  createdAt: number;
}

/**
 * Convert polar coordinates (angle in degrees, distance) to cartesian (x, y)
 */
export function polarToCartesian(
  angleDegrees: number,
  distance: number,
  center = CENTER
): { x: number; y: number } {
  const angleRadians = (angleDegrees - 90) * (Math.PI / 180); // -90 to start from top
  return {
    x: center.x + distance * Math.cos(angleRadians),
    y: center.y + distance * Math.sin(angleRadians),
  };
}

/**
 * Calculate subject node position based on index and total count
 * Distributes subjects evenly around the circle
 */
export function getSubjectPosition(index: number, total: number): { x: number; y: number; angle: number } {
  const angle = (360 / total) * index;
  const pos = polarToCartesian(angle, SUBJECT_DISTANCE);
  return { ...pos, angle };
}

/**
 * Calculate difficulty score for a major objective based on its subs
 * Beginner = 1, Intermediate = 2, Advanced = 3
 */
function getMajorDifficultyScore(subObjectives: any[]): number {
  if (!subObjectives.length) return 0;
  
  const sum = subObjectives.reduce((acc, sub) => {
    switch (sub.difficulty) {
      case "advanced": return acc + 3;
      case "intermediate": return acc + 2;
      case "beginner":
      default: return acc + 1;
    }
  }, 0);
  
  return sum / subObjectives.length;
}

/**
 * Calculate positions for the Adventure Map (Horizontal Layout)
 */
export function calculateSkillTreePositions(
  majors: Array<{
    _id: Id<"majorObjectives">;
    title: string;
    description: string;
    createdAt: number;
    subObjectives: Array<{
      _id: Id<"learningObjectives">;
      title: string;
      description: string;
      difficulty: "beginner" | "intermediate" | "advanced";
      createdAt: number;
    }>;
  }>,
  _domainAngle: number // Unused in horizontal layout but kept for signature compatibility
): { nodes: PositionedSkillNode[], width: number } {
  if (!majors.length) return { nodes: [], width: 800 };

  // 1. Sort Majors by Difficulty (Beginner -> Advanced)
  const sortedMajors = [...majors].sort((a, b) => {
    const scoreA = getMajorDifficultyScore(a.subObjectives);
    const scoreB = getMajorDifficultyScore(b.subObjectives);
    return scoreA - scoreB || a.createdAt - b.createdAt;
  });

  const positioned: PositionedSkillNode[] = [];
  
  // Start X position (Subject is not in this list, but we assume it's at x=100)
  // We start majors after the subject
  let currentX = 300; 

  sortedMajors.forEach((major) => {
    // Determine space needed based on sub-objectives count
    // Position Major Node
    const majorPosition = { x: currentX, y: CENTER_Y };
    
    positioned.push({
      id: major._id,
      type: "major",
      title: major.title,
      description: major.description,
      position: majorPosition,
      parentPosition: { x: 100, y: CENTER_Y }, // Connects back to Subject (approx)
      parentId: null,
      createdAt: major.createdAt,
    });

    // Position Sub Nodes (Fan Distribution)
    // Sort subs: beginner -> advanced
    const sortedSubs = [...major.subObjectives].sort((a, b) => {
      const diffOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      return (diffOrder[a.difficulty] || 1) - (diffOrder[b.difficulty] || 1);
    });

    sortedSubs.forEach((sub, subIndex) => {
      // Fan logic:
      // Alternate Up/Down
      const isTop = subIndex % 2 === 0;
      const verticalOffset = (Math.floor(subIndex / 2) + 1) * VERTICAL_SPREAD;
      const yPos = isTop ? CENTER_Y - verticalOffset : CENTER_Y + verticalOffset;
      
      // Fan out horizontally
      // We shift them slightly right relative to major to create a forward momentum
      const xOffset = 60 + (subIndex * 20); 
      const xPos = currentX + xOffset;

      positioned.push({
        id: sub._id,
        type: "sub",
        title: sub.title,
        description: sub.description,
        difficulty: sub.difficulty,
        position: { x: xPos, y: yPos },
        parentPosition: majorPosition,
        parentId: major._id,
        createdAt: sub.createdAt,
      });
    });

    // Advance X for next major
    // Gap depends on how many subs this major had (to avoid overlap)
    // The "cluster" width is roughly determined by the last sub's x-offset
    const clusterWidth = sortedSubs.length > 0 ? (60 + (sortedSubs.length * 20)) : 0;
    currentX += Math.max(MIN_GAP_BETWEEN_MAJORS, clusterWidth + 150);
  });

  return { nodes: positioned, width: currentX + 200 };
}

/**
 * Generate SVG path for a curved "Adventure Path"
 * Quadratic bezier with some randomness/organic feel
 */
export function generateConnectionPath(
  start: { x: number; y: number },
  end: { x: number; y: number }
): string {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Curvature: If horizontal distance is large, dip or arc more
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // For Adventure Map:
  // If moving mostly horizontal (Subject -> Major), arc slightly up or down
  // If moving to sub (fan), simple curve
  
  // Control point
  // We want a nice organic curve. 
  // Let's offset the control point perpendicular to the midpoint
  
  // Simple quadratic curve
  // Control point X is midway
  // Control point Y is offset to create curve
  
  let controlX = midX;
  let controlY = midY;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Mostly horizontal
    controlY += (start.y < end.y ? 30 : -30); 
  } else {
    // Mostly vertical
    controlX += (start.x < end.x ? 20 : -20);
  }

  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
}

export function getActivityIcon(type: string): string {
  switch (type) {
    case "video": return "Play";
    case "exercise": return "PencilLine";
    case "reading": return "BookOpen";
    case "project": return "FolderOpen";
    case "game": return "GameController";
    default: return "Circle";
  }
}
