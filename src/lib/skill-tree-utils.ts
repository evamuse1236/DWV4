import type { Id } from "../../convex/_generated/dataModel";

/**
 * Skill Tree positioning and configuration utilities
 * Handles polar coordinate calculations and domain/difficulty mappings
 */

// Canvas center point (800x800 container)
export const CENTER = { x: 400, y: 400 };

// Node sizes
export const SUBJECT_NODE_SIZE = 120;
export const SKILL_NODE_SIZE = 60;

// Distance tiers for skill nodes based on difficulty
export const DIFFICULTY_DISTANCES: Record<string, number> = {
  beginner: 160,
  intermediate: 240,
  advanced: 320,
};

// Subject distance from center
export const SUBJECT_DISTANCE = 180;

// Domain configuration with angles, colors, and icons
export interface DomainConfig {
  angle: number; // degrees from 12 o'clock position
  color: string; // CSS variable or hex color
  colorClass: string; // CSS class for background
  iconName: string; // Phosphor icon name
}

/**
 * Get domain configuration based on domain name
 * Maps domain names to fixed positions around the circle
 */
export function getDomainConfig(domainName: string): DomainConfig {
  const name = domainName.toLowerCase();

  // Coding/Engineering → top (12 o'clock)
  if (name.includes("cod") || name.includes("engineer") || name.includes("programming")) {
    return {
      angle: -90,
      color: "var(--skill-col-coding)",
      colorClass: "subject-coding",
      iconName: "Code",
    };
  }

  // Maths/Mathematics → bottom-left (7 o'clock)
  if (name.includes("math")) {
    return {
      angle: 150,
      color: "var(--skill-col-maths)",
      colorClass: "subject-maths",
      iconName: "Function",
    };
  }

  // Reading/Literature → bottom-right (5 o'clock)
  if (name.includes("read") || name.includes("liter") || name.includes("book")) {
    return {
      angle: 30,
      color: "var(--skill-col-reading)",
      colorClass: "subject-reading",
      iconName: "BookOpen",
    };
  }

  // Writing → right side (3 o'clock)
  if (name.includes("writ") || name.includes("essay") || name.includes("composition")) {
    return {
      angle: -30,
      color: "var(--skill-col-writing)",
      colorClass: "subject-writing",
      iconName: "Star",
    };
  }

  // Default fallback - use a neutral position
  return {
    angle: 90,
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
  const angleRadians = angleDegrees * (Math.PI / 180);
  return {
    x: center.x + distance * Math.cos(angleRadians),
    y: center.y + distance * Math.sin(angleRadians),
  };
}

/**
 * Calculate subject node position based on domain config
 */
export function getSubjectPosition(domainName: string): { x: number; y: number } {
  const config = getDomainConfig(domainName);
  return polarToCartesian(config.angle, SUBJECT_DISTANCE);
}

/**
 * Objective with calculated position
 */
export interface PositionedObjective {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  position: { x: number; y: number };
  parentPosition: { x: number; y: number };
  parentId: string | null; // ID of parent objective or 'root' for subject node
  createdAt: number;
}

/**
 * Calculate positions for all skill nodes in a domain
 *
 * Algorithm:
 * 1. Group objectives by difficulty tier
 * 2. Sort by createdAt within each tier for stable ordering
 * 3. Spread nodes evenly within ±30° of parent's angle
 * 4. Beginner → connects to subject (root)
 * 5. Intermediate → connects to oldest beginner
 * 6. Advanced → connects to oldest intermediate
 */
export function calculateSkillPositions(
  objectives: Array<{
    _id: Id<"learningObjectives">;
    title: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    createdAt: number;
  }>,
  domainAngle: number
): PositionedObjective[] {
  if (!objectives.length) return [];

  // Sort by createdAt for stable ordering
  const sorted = [...objectives].sort((a, b) => a.createdAt - b.createdAt);

  // Group by difficulty
  const byDifficulty = {
    beginner: sorted.filter(o => o.difficulty === "beginner"),
    intermediate: sorted.filter(o => o.difficulty === "intermediate"),
    advanced: sorted.filter(o => o.difficulty === "advanced"),
  };

  const positioned: PositionedObjective[] = [];
  const rootPosition = polarToCartesian(domainAngle, SUBJECT_DISTANCE);

  // Spread angle range (±30° from parent)
  const spreadRange = 60;

  // Position beginner nodes (connect to subject/root)
  if (byDifficulty.beginner.length > 0) {
    const beginnerAngles = distributeAngles(
      domainAngle,
      spreadRange,
      byDifficulty.beginner.length
    );

    byDifficulty.beginner.forEach((obj, i) => {
      positioned.push({
        id: obj._id,
        title: obj.title,
        description: obj.description,
        difficulty: obj.difficulty,
        position: polarToCartesian(beginnerAngles[i], DIFFICULTY_DISTANCES.beginner),
        parentPosition: rootPosition,
        parentId: null, // Root
        createdAt: obj.createdAt,
      });
    });
  }

  // Position intermediate nodes (connect to oldest beginner)
  if (byDifficulty.intermediate.length > 0) {
    // Find the oldest beginner to connect to
    const oldestBeginner = positioned.find(p => p.difficulty === "beginner");
    const parentPos = oldestBeginner?.position || rootPosition;
    const parentAngle = oldestBeginner
      ? Math.atan2(parentPos.y - CENTER.y, parentPos.x - CENTER.x) * (180 / Math.PI)
      : domainAngle;

    const intermediateAngles = distributeAngles(
      parentAngle,
      spreadRange * 0.8, // Slightly narrower spread
      byDifficulty.intermediate.length
    );

    byDifficulty.intermediate.forEach((obj, i) => {
      positioned.push({
        id: obj._id,
        title: obj.title,
        description: obj.description,
        difficulty: obj.difficulty,
        position: polarToCartesian(intermediateAngles[i], DIFFICULTY_DISTANCES.intermediate),
        parentPosition: parentPos,
        parentId: oldestBeginner?.id || null,
        createdAt: obj.createdAt,
      });
    });
  }

  // Position advanced nodes (connect to oldest intermediate)
  if (byDifficulty.advanced.length > 0) {
    // Find the oldest intermediate to connect to
    const oldestIntermediate = positioned.find(p => p.difficulty === "intermediate");
    const parentPos = oldestIntermediate?.position
      || positioned.find(p => p.difficulty === "beginner")?.position
      || rootPosition;
    const parentAngle = Math.atan2(parentPos.y - CENTER.y, parentPos.x - CENTER.x) * (180 / Math.PI);

    const advancedAngles = distributeAngles(
      parentAngle,
      spreadRange * 0.6, // Even narrower
      byDifficulty.advanced.length
    );

    byDifficulty.advanced.forEach((obj, i) => {
      positioned.push({
        id: obj._id,
        title: obj.title,
        description: obj.description,
        difficulty: obj.difficulty,
        position: polarToCartesian(advancedAngles[i], DIFFICULTY_DISTANCES.advanced),
        parentPosition: parentPos,
        parentId: oldestIntermediate?.id || positioned.find(p => p.difficulty === "beginner")?.id || null,
        createdAt: obj.createdAt,
      });
    });
  }

  // Check for collisions and adjust if needed
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
function resolveCollisions(nodes: PositionedObjective[]): PositionedObjective[] {
  const MIN_DISTANCE = 70; // Minimum pixels between node centers
  const MAX_ITERATIONS = 10;

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
