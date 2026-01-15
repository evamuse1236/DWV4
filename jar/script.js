/**
 * TRUST JAR - PHYSICS ART EDITION
 * Powered by Matter.js logic + DOM Rendering
 */

const MAX = 50;
const STORAGE_KEY = 'trust_art_physics_v1';

// Physics Aliases
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Composite = Matter.Composite,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Events = Matter.Events;

// DOM
const stage = document.getElementById('stage');
const countDisplay = document.querySelector('.counter');
const modal = document.getElementById('reward-modal');

// Config
const MARBLE_R = 34; // Increased by another 20%
const WALL_THICK = 60;
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

// State
let engine;
let count = 0;
let marbles = []; // { body, element }
let isRunning = true;

function init() {
    // 1. Setup Engine
    engine = Engine.create();
    engine.world.gravity.y = 1;

    // 2. Setup Boundaries (Invisible Funnel)
    const cx = WIDTH / 2;
    const cy = HEIGHT;

    // Bottom platform
    const ground = Bodies.rectangle(cx, HEIGHT + 40, 500, WALL_THICK, { isStatic: true });

    // Funnel Walls
    const leftWall = Bodies.rectangle(cx - 240, HEIGHT - 300, WALL_THICK, 800, {
        isStatic: true,
        angle: -0.15
    });

    const rightWall = Bodies.rectangle(cx + 240, HEIGHT - 300, WALL_THICK, 800, {
        isStatic: true,
        angle: 0.15
    });

    Composite.add(engine.world, [ground, leftWall, rightWall]);

    // 3. Start Runner
    const runner = Runner.create();
    Runner.run(runner, engine);

    // 4. Render Loop
    requestAnimationFrame(renderLoop);

    // 5. Load State
    const saved = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    if (saved > 0) {
        // Fast restore
        for (let i = 0; i < Math.min(saved, MAX); i++) {
            addMarblePhysics(true);
        }
    }
    count = marbles.length;
    updateUI();

    // Listeners
    document.getElementById('btn-add').addEventListener('click', addClick);
    document.getElementById('btn-remove').addEventListener('click', removeClick);
    document.getElementById('btn-reset').addEventListener('click', reset);
}

function updateUI() {
    countDisplay.textContent = `${count} / ${MAX}`;
}

function save() {
    localStorage.setItem(STORAGE_KEY, count);
}

// Helper: Random Blob Shape
function getRandomShape() {
    const r = () => Math.floor(Math.random() * 40) + 30;
    return `${r()}% ${r()}% ${r()}% ${r()}% / ${r()}% ${r()}% ${r()}% ${r()}%`;
}

// ACTION: Add
function addClick() {
    if (count >= MAX) return;
    addMarblePhysics(false);
    count++;
    updateUI();
    save();

    if (count === MAX) {
        setTimeout(() => modal.classList.add('active'), 1000);
    }
}

function addMarblePhysics(isLoad) {
    const cx = WIDTH / 2;
    const spawnX = cx + (Math.random() - 0.5) * 150;
    const spawnY = isLoad ? HEIGHT - 100 - (marbles.length * 15) : -60;

    const body = Bodies.circle(spawnX, spawnY - Math.random() * 100, MARBLE_R, {
        restitution: 0.4,
        friction: 0.5,
        frictionAir: 0.02,
        density: 0.05,
        angle: Math.random() * Math.PI * 2
    });

    Composite.add(engine.world, body);

    const el = document.createElement('div');
    el.className = 'vis-marble';

    const colorClass = `c${Math.floor(Math.random() * 5) + 1}`;
    el.classList.add(colorClass);

    el.style.borderRadius = getRandomShape();

    const scale = 0.9 + Math.random() * 0.3;
    el.style.width = `${MARBLE_R * 2 * scale}px`;
    el.style.height = `${MARBLE_R * 2 * scale}px`;

    stage.appendChild(el);

    marbles.push({ body, element: el });
}

// ACTION: Remove
function removeClick() {
    if (count <= 0) return;

    marbles.sort((a, b) => a.body.position.y - b.body.position.y);
    const target = marbles[0];

    target.element.style.transition = "transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.4s";
    target.element.style.opacity = "0";
    target.element.style.transform += " scale(0)";

    setTimeout(() => {
        Composite.remove(engine.world, target.body);
        if (target.element.parentNode) target.element.remove();
        marbles = marbles.filter(m => m !== target);
    }, 400);

    count--;
    updateUI();
    save();
}

function reset() {
    marbles.forEach(m => {
        Composite.remove(engine.world, m.body);
        if (m.element.parentNode) m.element.remove();
    });
    marbles = [];
    count = 0;
    save();
    updateUI();
    modal.classList.remove('active');
}

function renderLoop() {
    if (!isRunning) return;

    marbles.forEach(m => {
        const { x, y } = m.body.position;
        const r = m.body.angle;

        const w = parseFloat(m.element.style.width);
        const h = parseFloat(m.element.style.height);

        const top = y - (h / 2);
        const left = x - (w / 2);

        m.element.style.transform = `translate(${left}px, ${top}px) rotate(${r}rad)`;
    });

    requestAnimationFrame(renderLoop);
}

init();
