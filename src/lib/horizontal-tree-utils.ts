import type { Id } from "../../convex/_generated/dataModel";

/**
 * Horizontal Skill Tree positioning and configuration
 */

// Canvas constants
export const CANVAS_HEIGHT = 800; // Fixed height for centering
export const DOMAIN_X = 150; // Fixed Left position for Domain
export const CENTER_Y = CANVAS_HEIGHT / 2;

// Spacing constants
export const HORIZONTAL_SPACING = 250; // Distance between major steps
export const VERTICAL_OFFSET = 120; // How much majors go up/down from center
export const SUB_OFFSET_X = 100; // Horizontal distance to sub-nodes
export const SUB_OFFSET_Y = 80; // Vertical spread for sub-nodes

/**
 * Node with calculated position
 */
export interface HorizontalPositionedNode {
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
 * Calculate positions for horizontal layout
 * 
 * Layout:
 * 1. Domain pinned at left center
 * 2. Majors arranged linearly left-to-right
 * 3. Majors alternate UP and DOWN positions relative to center line
 * 4. Subs branch off their parent Major
 */
export function calculateHorizontalPositions(
    domain: { _id: string; name: string },
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
    }>
): HorizontalPositionedNode[] {
    const positioned: HorizontalPositionedNode[] = [];

    // 1. Position Domain Node
    const domainPos = { x: DOMAIN_X, y: CENTER_Y };
    /* 
     * Note: We don't necessarily need to push the domain node into the 'positioned' array 
     * if the Canvas renders it separately (like SkillTreeCanvas does), 
     * but for a unified list we can. 
     * However, the existing Canvas renders SubjectNode separately. 
     * We'll follow that pattern and return just the objectives, 
     * or we can return everything. 
     * Let's return just objectives to match calculateSkillTreePositions' return type roughly
     * but the Canvas will need to handle the domain position knowledge.
     */

    const sortedMajors = [...majors].sort((a, b) => a.createdAt - b.createdAt);

    sortedMajors.forEach((major, index) => {
        // 2. Position Major Nodes
        // Alternating Up/Down: Even indices (0, 2) UP, Odd (1, 3) DOWN? 
        // Or based on user preference. Let's do: 0 -> UP, 1 -> DOWN
        const dir = index % 2 === 0 ? -1 : 1; // -1 is Up (smaller Y)

        // X progresses linearly
        const majorX = DOMAIN_X + HORIZONTAL_SPACING * (index + 1);
        const majorY = CENTER_Y + (VERTICAL_OFFSET * dir);

        const majorPos = { x: majorX, y: majorY };

        // Parent for the first major could be Domain
        // Parent for subsequent majors? 
        // The prompt implies a "branching" from domain.
        // But if it's a timeline, they might connect to previous major?
        // "domain will be on the left it will branch out ... into objectives"
        // Usually means structure is Domain -> Major 1, Domain -> Major 2.
        // But if spaced horizontally 200px, 400px, 600px... having them all connect back to x=100 looks like a fan.
        // The "start" node in the image connects to 'Variables', which connects to 'Constants'.
        // This implies a LINKED LIST structure: Domain -> Major 1 -> Major 2 -> Major 3.

        const actualParentPos = index === 0 ? domainPos : {
            x: DOMAIN_X + HORIZONTAL_SPACING * index,
            y: CENTER_Y + (VERTICAL_OFFSET * ((index - 1) % 2 === 0 ? -1 : 1))
        };

        const parentId = index === 0 ? domain._id : sortedMajors[index - 1]._id;

        positioned.push({
            id: major._id,
            type: "major",
            title: major.title,
            description: major.description,
            position: majorPos,
            parentPosition: actualParentPos,
            parentId: parentId,
            createdAt: major.createdAt,
        });

        // 3. Position Sub Nodes
        // Branching off the Major
        const sortedSubs = [...major.subObjectives].sort((a, b) => a.createdAt - b.createdAt);

        if (sortedSubs.length > 0) {
            // Fan out subs to the right of the major
            // If Major is UP, maybe subs hang down? If Major is DOWN, subs stack up?
            // Or just fan out radially/right-ward.

            sortedSubs.forEach((sub, subIndex) => {
                // Simple stacking for now:
                // x = majorX + offset
                // y = majorY + (subIndex centered offset)

                const subX = majorX + SUB_OFFSET_X;

                // Spread vertically
                // shifts: 0 -> 0, 1 -> -30, 2 -> 30 ? 
                // Let's just stack them vertically
                const totalHeight = (sortedSubs.length - 1) * 60;
                const startY = majorY - totalHeight / 2;
                const subY = startY + (subIndex * 60);

                // Or if we want to follow the "wavy" look, maybe they continue the wave?
                // Let's stick to simple branching from the major node for subs.

                positioned.push({
                    id: sub._id,
                    type: "sub",
                    title: sub.title,
                    description: sub.description,
                    difficulty: sub.difficulty,
                    position: { x: subX, y: subY },
                    parentPosition: majorPos,
                    parentId: major._id,
                    createdAt: sub.createdAt,
                });
            });
        }
    });

    return positioned;
}

/**
 * Generate Horizontal Bezier Path
 * S-curve from start to end
 */
export function generateHorizontalConnectionPath(
    start: { x: number; y: number },
    end: { x: number; y: number }
): string {
    // Horizontal Bezier
    // Control points needs to be handled to ensure smooth S shape
    // CP1 should be to the Right of Start
    // CP2 should be to the Left of End

    const dist = Math.abs(end.x - start.x);
    const cpOffset = dist * 0.5;

    const cp1 = { x: start.x + cpOffset, y: start.y };
    const cp2 = { x: end.x - cpOffset, y: end.y };

    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
}
