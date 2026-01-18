import type { Id } from "../../convex/_generated/dataModel";

/**
 * Skill Tree positioning and configuration utilities
 * Handles polar coordinate calculations and domain/difficulty mappings
 */

// Canvas center point (800x800 container)
export const CENTER = { x: 400, y: 400 };

// Node sizes
export const SUBJECT_NODE_SIZE = 120;
export const MAJOR_NODE_SIZE = 86;
export const SUB_NODE_SIZE = 54;

// Distances for tree depth - relative to parent node
export const MAJOR_DISTANCE = 220; // Distance from Subject node
export const SUB_DIFFICULTY_DISTANCES: Record<string, number> = {
  beginner: 140,    // Distance from Major node
  intermediate: 180,
  advanced: 220,
};

// Subject distance from center
export const SUBJECT_DISTANCE = 180;

// Domain configuration with angles, colors, and icons
export interface DomainConfig {
  color: string; // CSS variable or hex color
  colorClass: string; // CSS class for background
  iconName: string; // Phosphor icon name
}

/**
 * Get domain configuration based on domain name
 * Maps domain names to colors and icons
 */
export function getDomainConfig(domainName: string): DomainConfig {
  const name = domainName.toLowerCase();

  // Coding/Engineering
  if (name.includes("cod") || name.includes("engineer") || name.includes("programming")) {
    return {
      color: "var(--skill-col-coding)",
      colorClass: "subject-coding",
      iconName: "Code",
    };
  }

  // Maths/Mathematics
  if (name.includes("math")) {
    return {
      color: "var(--skill-col-maths)",
      colorClass: "subject-maths",
      iconName: "Function",
    };
  }

  // Reading/Literature
  if (name.includes("read") || name.includes("liter") || name.includes("book")) {
    return {
      color: "var(--skill-col-reading)",
      colorClass: "subject-reading",
      iconName: "BookOpen",
    };
  }

  // Writing
  if (name.includes("writ") || name.includes("essay") || name.includes("composition")) {
    return {
      color: "var(--skill-col-writing)",
      colorClass: "subject-writing",
      iconName: "Star",
    };
  }

  // Default fallback
  return {
    color: "#f3f4f6",
    colorClass: "",
    iconName: "Star",
  };
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
  parentId: string | null; // ID of parent objective or 'root' for subject node
  createdAt: number;
}

/**
 * Calculate positions for major and sub objectives in a domain
 *
 * Algorithm:
 * 1. Subject node is the center of the skill tree
 * 2. Major objectives spread evenly around 360° from the subject
 * 3. Sub objectives branch outward from their parent major
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
  _domainAngle: number // kept for API compatibility
): PositionedSkillNode[] {
  if (!majors.length) return [];

  const sortedMajors = [...majors].sort((a, b) => a.createdAt - b.createdAt);

  // When expanded, the subject becomes the CENTER of the skill tree
  // Use the canvas center as the origin for the tree
  const subjectPosition = CENTER;

  const positioned: PositionedSkillNode[] = [];

  // Distribute majors evenly around 360° from the subject node
  sortedMajors.forEach((major, index) => {
    // Each major gets an even slice of the circle
    const majorAngle = (360 / sortedMajors.length) * index;

    // Position major relative to subject (subject is the new center)
    const majorPosition = polarToCartesian(majorAngle, MAJOR_DISTANCE, subjectPosition);

    positioned.push({
      id: major._id,
      type: "major",
      title: major.title,
      description: major.description,
      position: majorPosition,
      parentPosition: subjectPosition,
      parentId: null,
      createdAt: major.createdAt,
    });

    const sortedSubs = [...major.subObjectives].sort(
      (a, b) => a.createdAt - b.createdAt
    );

    if (sortedSubs.length === 0) return;

    // Subs fan out from the major, centered on the same angle (pointing outward)
    const subSpread = Math.min(60, 20 + sortedSubs.length * 15);
    const subAngles = distributeAngles(majorAngle, subSpread, sortedSubs.length);

    sortedSubs.forEach((sub, subIndex) => {
      const distance =
        SUB_DIFFICULTY_DISTANCES[sub.difficulty] ||
        SUB_DIFFICULTY_DISTANCES.beginner;

      // Position sub relative to the major node (branching outward)
      const subPosition = polarToCartesian(subAngles[subIndex], distance, majorPosition);

      positioned.push({
        id: sub._id,
        type: "sub",
        title: sub.title,
        description: sub.description,
        difficulty: sub.difficulty,
        position: subPosition,
        parentPosition: majorPosition,
        parentId: major._id,
        createdAt: sub.createdAt,
      });
    });
  });

  return resolveCollisions(positioned);
}

/**
 * Distribute N angles evenly within a range centered on baseAngle
 */
function distributeAngles(baseAngle: number, rangeSpread: number, count: number): number[] {
  if (count === 1) return [baseAngle];

  const startAngle = baseAngle - rangeSpread / 2;
  const step = rangeSpread / (count - 1);

  return Array.from({ length: count }, (_, i) => startAngle + i * step);
}

/**
 * Resolve collisions between nodes by pushing them apart
 */
function resolveCollisions(nodes: PositionedSkillNode[]): PositionedSkillNode[] {
  const MIN_DISTANCE = 85; // Minimum pixels between node centers
  const MAX_ITERATIONS = 20;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let hadCollision = false;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].position.x - nodes[i].position.x;
        const dy = nodes[j].position.y - nodes[i].position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < MIN_DISTANCE && distance > 0) {
          hadCollision = true;
          // Push nodes apart
          const overlap = (MIN_DISTANCE - distance) / 2;
          const angle = Math.atan2(dy, dx);

          nodes[i].position.x -= Math.cos(angle) * overlap;
          nodes[i].position.y -= Math.sin(angle) * overlap;
          nodes[j].position.x += Math.cos(angle) * overlap;
          nodes[j].position.y += Math.sin(angle) * overlap;
        }
      }
    }

    if (!hadCollision) break;
  }

  return nodes;
}

/**
 * Generate SVG path for a curved connection line
 * Creates a quadratic bezier curve that bows outward from center
 */
export function generateConnectionPath(
  start: { x: number; y: number },
  end: { x: number; y: number }
): string {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Vector from center to midpoint (for curve direction)
  const vecX = midX - CENTER.x;
  const vecY = midY - CENTER.y;

  // Control point pushes the curve outward from center
  const controlX = midX + vecX * 0.3;
  const controlY = midY + vecY * 0.3;

  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
}

/**
 * Get icon name for activity type
 */
export function getActivityIcon(type: string): string {
  switch (type) {
    case "video":
      return "Play";
    case "exercise":
      return "PencilLine";
    case "reading":
      return "BookOpen";
    case "project":
      return "FolderOpen";
    case "game":
      return "GameController";
    default:
      return "Circle";
  }
}
