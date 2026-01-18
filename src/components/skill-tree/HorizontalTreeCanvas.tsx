import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CaretLeft } from "@phosphor-icons/react";
import SubjectNode from "./SubjectNode";
import SkillNode from "./SkillNode";
import SVGConnections from "./SVGConnections";
import {
    calculateHorizontalPositions,
    DOMAIN_X,
    CENTER_Y,
    type HorizontalPositionedNode,
} from "../../lib/horizontal-tree-utils";
import type { Id } from "../../../convex/_generated/dataModel";
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

interface HorizontalTreeCanvasProps {
    domain: Domain;
    majors: MajorObjectiveEntry[];
    selectedNode: SelectedNode | null;
    onSelectNode: (node: SelectedNode | null) => void;
    onBack: () => void;
}

/**
 * HorizontalTreeCanvas - Horizontal branching skill tree visualization
 * 
 * Features:
 * - Domain anchored on left
 * - Objectives flowing right in alternating up/down pattern
 * - Horizontal scrolling container
 * - Dashed organic connection lines
 */
export function HorizontalTreeCanvas({
    domain,
    majors,
    selectedNode,
    onSelectNode,
    onBack,
}: HorizontalTreeCanvasProps) {
    const [positionedNodes, setPositionedNodes] = useState<HorizontalPositionedNode[]>([]);
    const [showSkills, setShowSkills] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Animation state - tree content visibility only (domain slides via CSS animation)
    const [showTreeContent, setShowTreeContent] = useState(false);

    // Drag-to-scroll state
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    // Drag-to-scroll handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;
        isDragging.current = true;
        startX.current = e.pageX - containerRef.current.offsetLeft;
        scrollLeft.current = containerRef.current.scrollLeft;
        containerRef.current.style.cursor = 'grabbing';
    }, []);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        if (containerRef.current) {
            containerRef.current.style.cursor = 'grab';
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        e.preventDefault();
        const x = e.pageX - containerRef.current.offsetLeft;
        const walk = (x - startX.current) * 1.5; // Scroll speed multiplier
        containerRef.current.scrollLeft = scrollLeft.current - walk;
    }, []);

    const handleMouseLeave = useCallback(() => {
        isDragging.current = false;
        if (containerRef.current) {
            containerRef.current.style.cursor = 'grab';
        }
    }, []);

    // Status mapping logic (reused from SkillTreeCanvas for consistency)
    const subStatusByObjectiveId = useMemo(() => {
        const map = new Map<string, { status: string; completed: boolean }>();
        majors.forEach((major) => {
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
    }, [majors]);

    const majorStatusById = useMemo(() => {
        const map = new Map<string, { status: string; isReady: boolean; hasActiveWork: boolean }>();
        majors.forEach((major) => {
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
    }, [majors, subStatusByObjectiveId]);

    // Calculate Positions
    useEffect(() => {
        const majorsForPositioning = majors.map((entry) => ({
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

        const positioned = calculateHorizontalPositions(
            { _id: domain._id, name: domain.name },
            majorsForPositioning
        );

        setPositionedNodes(positioned);
    }, [domain, majors]);

    // Entry animation: show tree after a short delay (domain slides via CSS)
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTreeContent(true);
            setShowSkills(true);
        }, 400); // Delay to let domain slide animation start
        return () => clearTimeout(timer);
    }, []);

    // Handle back - simplified, tree fades first then navigate
    const handleBack = useCallback(() => {
        setShowTreeContent(false);
        setShowSkills(false);
        setTimeout(() => {
            onBack();
        }, 300);
    }, [onBack]);

    // Scroll active node into view if needed
    useEffect(() => {
        if (selectedNode && containerRef.current) {
            // Find node position
            const node = positionedNodes.find(n => n.id === selectedNode.id);
            if (node) {
                // Simple smooth scroll to center horizontal
                // This acts as "Follow the user's focus"
                const scrollLeft = node.position.x - containerRef.current.clientWidth / 2;
                containerRef.current.scrollTo({
                    left: Math.max(0, scrollLeft),
                    behavior: 'smooth'
                });
            }
        }
    }, [selectedNode, positionedNodes]);

    // Enable wheel-to-horizontal scroll for premium feel
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;
            // Prevent default vertical scroll
            e.preventDefault();
            // Scroll horizontally instead
            container.scrollLeft += e.deltaY;
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, []);

    const handleMajorClick = useCallback(
        (majorId: string) => {
            onSelectNode({ type: "major", id: majorId });
        },
        [onSelectNode]
    );

    const handleSubClick = useCallback(
        (subObjectiveId: string) => {
            onSelectNode({ type: "sub", id: subObjectiveId });
        },
        [onSelectNode]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, type: "domain" | "major" | "sub", id: string) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (type === "major") handleMajorClick(id);
                if (type === "sub") handleSubClick(id);
                if (type === "domain") onBack();
            }
        },
        [handleMajorClick, handleSubClick, onBack]
    );

    // Determine container width based on furthest node
    const maxNodeX = Math.max(
        ...positionedNodes.map(n => n.position.x),
        DOMAIN_X
    ) + 300; // Extra padding

    return (
        <div className={styles['horizontal-stage']}>

            <button
                type="button"
                className={styles['back-btn-floating']}
                onClick={handleBack}
                aria-label="Back to subjects"
            >
                <CaretLeft size={18} weight="bold" />
                <span>Back to Overview</span>
            </button>

            <div
                className={styles['horizontal-scroll-container']}
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div style={{ width: maxNodeX, height: 800, position: 'relative' }}>
                    {/* Fixed domain position - CSS animation handles the slide */}
                    {(() => {
                        const domainPos = { x: DOMAIN_X, y: CENTER_Y };
                        return (
                            <>
                                <SVGConnections
                                    objectives={positionedNodes}
                                    subjectPosition={domainPos}
                                    isVisible={showTreeContent}
                                    layout="horizontal"
                                />

                                <SubjectNode
                                    id={domain._id}
                                    name={domain.name}
                                    position={domainPos}
                                    isSelected={true}
                                    isFaded={false}
                                    onClick={handleBack}
                                    onKeyDown={e => handleKeyDown(e, "domain", domain._id)}
                                    className={styles['subject-sliding']}
                                />
                            </>
                        );
                    })()}

                    {showTreeContent && positionedNodes.map((node, index) => {
                        if (node.type === "major") {
                            const majorState = majorStatusById.get(node.id);
                            return (
                                <SkillNode
                                    key={node.id}
                                    id={node.id}
                                    title={node.title}
                                    position={node.position}
                                    isActive={selectedNode?.type === "major" && selectedNode.id === node.id}
                                    isVisible={showSkills}
                                    delay={Math.min(index * 50, 600)}
                                    variant="major"
                                    status={majorState?.status}
                                    isReady={majorState?.isReady}
                                    isExpanded={true} // Always expanded in horizontal view
                                    onClick={() => handleMajorClick(node.id)}
                                    onKeyDown={e => handleKeyDown(e, "major", node.id)}
                                />
                            );
                        }

                        if (node.type === "sub") {
                            const subState = subStatusByObjectiveId.get(node.id);
                            return (
                                <SkillNode
                                    key={node.id}
                                    id={node.id}
                                    title={node.title}
                                    position={node.position}
                                    isActive={selectedNode?.type === "sub" && selectedNode.id === node.id}
                                    isVisible={showSkills}
                                    delay={Math.min(index * 50 + 200, 800)}
                                    difficulty={node.difficulty}
                                    variant="sub"
                                    status={subState?.status}
                                    onClick={() => handleSubClick(node.id)}
                                    onKeyDown={e => handleKeyDown(e, "sub", node.id)}
                                />
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}

export default HorizontalTreeCanvas;
