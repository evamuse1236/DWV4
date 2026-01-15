import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import "./TrustJarStyles.css";

interface TrustJarProps {
  count: number;
  maxCount: number;
  isAdmin?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  onReset?: () => void;
}

// Physics constants
const MARBLE_RADIUS = 34;
const WALL_THICKNESS = 60;
const MARBLE_REMOVAL_DELAY_MS = 400;
const JAR_FULL_CELEBRATION_DELAY_MS = 1000;

// Marble color classes (matches CSS)
const COLOR_CLASSES = ["c1", "c2", "c3", "c4", "c5"];

/**
 * Generate a random blob shape for organic look
 * Returns CSS border-radius value
 */
function getRandomBlobShape(): string {
  const randomPercent = () => Math.floor(Math.random() * 40) + 30;
  return `${randomPercent()}% ${randomPercent()}% ${randomPercent()}% ${randomPercent()}% / ${randomPercent()}% ${randomPercent()}% ${randomPercent()}% ${randomPercent()}%`;
}

/**
 * Get a random color class for a marble
 */
function getRandomColorClass(): string {
  const index = Math.floor(Math.random() * COLOR_CLASSES.length);
  return COLOR_CLASSES[index];
}

export function TrustJar({
  count,
  maxCount,
  isAdmin = false,
  onAdd,
  onRemove,
  onReset,
}: TrustJarProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const marblesRef = useRef<{ body: Matter.Body; element: HTMLDivElement }[]>(
    []
  );
  const prevCountRef = useRef(0);
  const [showModal, setShowModal] = useState(false);

  // Initialize physics engine
  useEffect(() => {
    if (!stageRef.current) return;

    const Engine = Matter.Engine;
    const Composite = Matter.Composite;
    const Bodies = Matter.Bodies;
    const Runner = Matter.Runner;

    const WIDTH = window.innerWidth;
    const HEIGHT = window.innerHeight;
    const cx = WIDTH / 2;

    // Create engine
    const engine = Engine.create();
    engine.world.gravity.y = 1;
    engineRef.current = engine;

    // Create boundaries (invisible funnel shape)
    const ground = Bodies.rectangle(cx, HEIGHT + 40, 500, WALL_THICKNESS, {
      isStatic: true,
    });
    const leftWall = Bodies.rectangle(cx - 240, HEIGHT - 300, WALL_THICKNESS, 800, {
      isStatic: true,
      angle: -0.15,
    });
    const rightWall = Bodies.rectangle(cx + 240, HEIGHT - 300, WALL_THICKNESS, 800, {
      isStatic: true,
      angle: 0.15,
    });

    Composite.add(engine.world, [ground, leftWall, rightWall]);

    // Start physics runner
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Render loop
    let animationId: number;
    const renderLoop = () => {
      marblesRef.current.forEach((m) => {
        const { x, y } = m.body.position;
        const r = m.body.angle;
        const w = parseFloat(m.element.style.width);
        const h = parseFloat(m.element.style.height);
        const top = y - h / 2;
        const left = x - w / 2;
        m.element.style.transform = `translate(${left}px, ${top}px) rotate(${r}rad)`;
      });
      animationId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      Runner.stop(runner);
      Engine.clear(engine);
      // Remove all marble elements
      marblesRef.current.forEach((m) => m.element.remove());
      marblesRef.current = [];
    };
  }, []);

  // Sync marbles with count from Convex
  useEffect(() => {
    if (!engineRef.current || !stageRef.current) return;

    const engine = engineRef.current;
    const stage = stageRef.current;
    const Composite = Matter.Composite;
    const Bodies = Matter.Bodies;

    const WIDTH = window.innerWidth;
    const HEIGHT = window.innerHeight;
    const cx = WIDTH / 2;

    const currentMarbleCount = marblesRef.current.length;
    const diff = count - currentMarbleCount;

    if (diff > 0) {
      // Add marbles
      for (let i = 0; i < diff; i++) {
        const isInitialLoad = prevCountRef.current === 0 && i < count;
        const spawnX = cx + (Math.random() - 0.5) * 150;
        // On initial load, stack marbles from bottom; otherwise drop from top
        const spawnY = isInitialLoad
          ? HEIGHT - 100 - marblesRef.current.length * 15
          : -60 - Math.random() * 100;

        const body = Bodies.circle(spawnX, spawnY, MARBLE_RADIUS, {
          restitution: 0.4,
          friction: 0.5,
          frictionAir: 0.02,
          density: 0.05,
          angle: Math.random() * Math.PI * 2,
        });

        Composite.add(engine.world, body);

        // Create visual marble element
        const el = document.createElement("div");
        el.className = "vis-marble";
        el.classList.add(getRandomColorClass());
        el.style.borderRadius = getRandomBlobShape();
        const scale = 0.9 + Math.random() * 0.3;
        el.style.width = `${MARBLE_RADIUS * 2 * scale}px`;
        el.style.height = `${MARBLE_RADIUS * 2 * scale}px`;

        stage.appendChild(el);
        marblesRef.current.push({ body, element: el });
      }
    } else if (diff < 0) {
      // Remove marbles from top (visually most natural)
      for (let i = 0; i < Math.abs(diff); i++) {
        if (marblesRef.current.length === 0) break;

        // Sort by Y position to find topmost marble
        marblesRef.current.sort((a, b) => a.body.position.y - b.body.position.y);
        const target = marblesRef.current[0];

        // Animate removal
        target.element.style.transition =
          "transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.4s";
        target.element.style.opacity = "0";
        target.element.style.transform += " scale(0)";

        setTimeout(() => {
          Composite.remove(engine.world, target.body);
          target.element.remove();
        }, MARBLE_REMOVAL_DELAY_MS);

        marblesRef.current = marblesRef.current.filter((m) => m !== target);
      }
    }

    prevCountRef.current = count;

    // Show celebration modal when jar is full
    if (count >= maxCount) {
      setTimeout(() => setShowModal(true), JAR_FULL_CELEBRATION_DELAY_MS);
    } else {
      setShowModal(false);
    }
  }, [count, maxCount]);

  function handleAdd(): void {
    if (count < maxCount) {
      onAdd?.();
    }
  }

  function handleRemove(): void {
    if (count > 0) {
      onRemove?.();
    }
  }

  function handleReset(): void {
    onReset?.();
    setShowModal(false);
  }

  return (
    <div className="trust-jar-container">
      {/* Artistic Background */}
      <div className="art-layer">
        <div className="blob b1"></div>
        <div className="blob b2"></div>
      </div>

      {/* UI Header */}
      <header className="ui-header">
        <h1>Collection</h1>
        <div className="counter">
          {String(count).padStart(2, "0")} / {maxCount}
        </div>
      </header>

      {/* Physics Stage */}
      <main className="sim-stage" ref={stageRef}>
        {/* Admin Controls */}
        {isAdmin && (
          <div className="controls-floating">
            <button
              className="action-btn remove"
              onClick={handleRemove}
              disabled={count <= 0}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <button
              className="action-btn add"
              onClick={handleAdd}
              disabled={count >= maxCount}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        )}
      </main>

      {/* Celebration Modal */}
      <div className={`modal-blur ${showModal ? "active" : ""}`}>
        <div className="modal-content">
          <h2>Complete</h2>
          <p>The vessel is full.</p>
          {isAdmin && <button onClick={handleReset}>Reset</button>}
        </div>
      </div>
    </div>
  );
}
