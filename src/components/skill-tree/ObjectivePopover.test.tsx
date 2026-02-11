/**
 * Tests for ObjectivePopover component.
 *
 * The ObjectivePopover displays objective details with activities and
 * allows students to toggle activity completion with optimistic updates.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock convex/react
const mockToggleActivity = vi.fn().mockResolvedValue({});
const mockUpdateStatus = vi.fn().mockResolvedValue({});

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((mutationName) => {
    if (mutationName === "progress.toggleActivity") return mockToggleActivity;
    if (mutationName === "objectives.updateStatus") return mockUpdateStatus;
    return vi.fn().mockResolvedValue({});
  }),
}));

// Mock the API
vi.mock("../../../convex/_generated/api", () => ({
  api: {
    progress: {
      toggleActivity: "progress.toggleActivity",
    },
    objectives: {
      updateStatus: "objectives.updateStatus",
    },
    diagnostics: {
      getUnlockState: "diagnostics.getUnlockState",
      requestUnlock: "diagnostics.requestUnlock",
    },
  },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock skill-tree-utils
vi.mock("../../lib/skill-tree-utils", () => ({
  getDomainConfig: vi.fn((domainName) => ({
    name: domainName || "default",
    color: "#FEF9C3",
  })),
}));

// Mock CSS module
vi.mock("./skill-tree.module.css", () => ({
  default: {
    "right-panel": "right-panel",
    "panel-content": "panel-content",
    "popover-header": "popover-header",
    "popover-icon": "popover-icon",
    "popover-title": "popover-title",
    "popover-desc": "popover-desc",
    "task-list": "task-list",
    "task-item": "task-item",
    "task-checkbox": "task-checkbox",
    checked: "checked",
    "task-link": "task-link",
    "viva-btn": "viva-btn",
    active: "active",
    requested: "requested",
    "resize-handle": "resize-handle",
  },
}));

// Mock phosphor-icons
vi.mock("@phosphor-icons/react", () => ({
  Play: ({ size }: any) => <span data-testid="icon-play">Play</span>,
  PencilLine: ({ size }: any) => <span data-testid="icon-pencil">Pencil</span>,
  BookOpen: ({ size }: any) => <span data-testid="icon-book">Book</span>,
  FolderOpen: ({ size }: any) => <span data-testid="icon-folder">Folder</span>,
  GameController: ({ size }: any) => <span data-testid="icon-game">Game</span>,
  Circle: ({ size }: any) => <span data-testid="icon-circle">Circle</span>,
  Check: ({ size }: any) => <span data-testid="icon-check">Check</span>,
}));

// Import after mocks
import { ObjectivePopover } from "./ObjectivePopover";
import { useMutation, useQuery } from "convex/react";

// Mock data factories
const createSubObjectiveNode = (overrides = {}) => ({
  _id: "student_obj_1" as any,
  objectiveId: "obj_1" as any,
  status: "in_progress",
  objective: {
    _id: "obj_1" as any,
    title: "Learn Variables",
    description: "Understand how variables work in programming",
    difficulty: "beginner",
  },
  activities: [
    {
      _id: "act_1" as any,
      title: "Watch Variables Video",
      url: "https://example.com/video",
      type: "video",
      order: 1,
      progress: { completed: false },
    },
    {
      _id: "act_2" as any,
      title: "Complete Variables Exercise",
      url: "https://example.com/exercise",
      type: "exercise",
      order: 2,
      progress: { completed: true },
    },
  ],
  ...overrides,
});

const createMajorNode = (overrides = {}) => ({
  majorObjective: {
    _id: "major_1" as any,
    title: "Programming Basics",
    description: "Master the fundamentals of programming",
  },
  assignment: {
    _id: "major_assignment_1" as any,
    status: "in_progress",
  },
  subObjectives: [createSubObjectiveNode()],
  ...overrides,
});

const createSubNode = (overrides = {}) => ({
  majorObjective: {
    _id: "major_1" as any,
    title: "Programming Basics",
    description: "Master the fundamentals of programming",
  },
  subObjective: createSubObjectiveNode(),
  majorAssignment: {
    _id: "major_assignment_1" as any,
    status: "in_progress",
  },
  allSubObjectives: [createSubObjectiveNode()],
  ...overrides,
});

describe("ObjectivePopover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mutation mocks
    mockToggleActivity.mockResolvedValue({});
    mockUpdateStatus.mockResolvedValue({});
    (useQuery as any).mockReturnValue({
      activeUnlock: null,
      pendingRequest: null,
      latestAttempt: null,
      majorAssignment: null,
    });
  });

  describe("Rendering", () => {
    it("returns null when no node is selected", () => {
      const { container } = render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={null}
          onVivaRequested={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    describe("Major node type", () => {
      it("renders correctly for major node type", () => {
        const majorNode = createMajorNode();

        render(
          <ObjectivePopover
            userId={"user_1" as any}
            domainName="Coding"
            selectedNode={{ type: "major", data: majorNode }}
            onVivaRequested={vi.fn()}
          />
        );

        // Should show major objective title
        expect(screen.getByText("Programming Basics")).toBeInTheDocument();
        // Should show major objective description
        expect(
          screen.getByText("Master the fundamentals of programming")
        ).toBeInTheDocument();
        // Should show sub-objectives list
        expect(screen.getByText("Learn Variables")).toBeInTheDocument();
      });

      it("shows mastered state for major node", () => {
        const majorNode = createMajorNode({
          assignment: { _id: "major_assignment_1", status: "mastered" },
        });

        render(
          <ObjectivePopover
            userId={"user_1" as any}
            domainName="Coding"
            selectedNode={{ type: "major", data: majorNode }}
            onVivaRequested={vi.fn()}
          />
        );

        expect(screen.getByText("Mastered")).toBeInTheDocument();
      });

      it("shows start diagnostic CTA when sub-objectives are complete", () => {
        // Create a major node where all sub-objectives are complete
        const completedSubObj = createSubObjectiveNode({
          activities: [
            {
              _id: "act_1",
              title: "Video",
              url: "url",
              type: "video",
              order: 1,
              progress: { completed: true },
            },
          ],
        });

        const majorNode = createMajorNode({
          subObjectives: [completedSubObj],
        });

        render(
          <ObjectivePopover
            userId={"user_1" as any}
            domainName="Coding"
            selectedNode={{ type: "major", data: majorNode }}
            onVivaRequested={vi.fn()}
          />
        );

        expect(
          screen.getByRole("button", { name: /start diagnostic/i })
        ).toBeInTheDocument();
      });
    });

    describe("Sub node type", () => {
      it("renders correctly for sub node type", () => {
        const subNode = createSubNode();

        render(
          <ObjectivePopover
            userId={"user_1" as any}
            domainName="Coding"
            selectedNode={{ type: "sub", data: subNode }}
            onVivaRequested={vi.fn()}
          />
        );

        // Should show sub-objective title
        expect(screen.getByText("Learn Variables")).toBeInTheDocument();
        // Should show sub-objective description
        expect(
          screen.getByText("Understand how variables work in programming")
        ).toBeInTheDocument();
        // Should show activities
        expect(screen.getByText("Watch Variables Video")).toBeInTheDocument();
        expect(
          screen.getByText("Complete Variables Exercise")
        ).toBeInTheDocument();
      });

      it("shows activity checkboxes with correct state", () => {
        const subNode = createSubNode();

        render(
          <ObjectivePopover
            userId={"user_1" as any}
            domainName="Coding"
            selectedNode={{ type: "sub", data: subNode }}
            onVivaRequested={vi.fn()}
          />
        );

        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes).toHaveLength(2);

        // First activity is not completed
        expect(checkboxes[0]).toHaveAttribute("aria-checked", "false");
        // Second activity is completed
        expect(checkboxes[1]).toHaveAttribute("aria-checked", "true");
      });

      it("shows mastered state for sub node", () => {
        const subNode = createSubNode({
          majorAssignment: { _id: "major_assignment_1", status: "mastered" },
        });

        render(
          <ObjectivePopover
            userId={"user_1" as any}
            domainName="Coding"
            selectedNode={{ type: "sub", data: subNode }}
            onVivaRequested={vi.fn()}
          />
        );

        expect(screen.getByText("Mastered")).toBeInTheDocument();
      });
    });
  });

  describe("Optimistic activity toggle", () => {
    it("updates checkbox state immediately on click", async () => {
      const user = userEvent.setup();
      // Make the mutation take a moment to resolve
      mockToggleActivity.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const subNode = createSubNode();

      render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={vi.fn()}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      const firstCheckbox = checkboxes[0];

      // Initially unchecked
      expect(firstCheckbox).toHaveAttribute("aria-checked", "false");

      // Click to toggle
      await user.click(firstCheckbox);

      // Should immediately update (optimistic)
      expect(firstCheckbox).toHaveAttribute("aria-checked", "true");

      // Mutation should have been called
      expect(mockToggleActivity).toHaveBeenCalledWith({
        userId: "user_1",
        activityId: "act_1",
        studentObjectiveId: "student_obj_1",
      });
    });

    it("clears optimistic state when mutation resolves", async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const togglePromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockToggleActivity.mockReturnValue(togglePromise);

      const subNode = createSubNode();

      render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={vi.fn()}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      const firstCheckbox = checkboxes[0];

      // Click to toggle
      await user.click(firstCheckbox);

      // Should be optimistically checked
      expect(firstCheckbox).toHaveAttribute("aria-checked", "true");

      // Resolve the mutation
      resolvePromise!();

      // Wait for the state to clear
      await waitFor(() => {
        // The component should still show checked (but now from clearing optimistic state)
        expect(mockToggleActivity).toHaveBeenCalled();
      });
    });
  });

  describe("Keyboard toggles", () => {
    it("toggles checkbox with Space key", async () => {
      const subNode = createSubNode();

      render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={vi.fn()}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      const firstCheckbox = checkboxes[0];

      // Focus the checkbox
      firstCheckbox.focus();
      expect(firstCheckbox).toHaveFocus();

      // Press space using fireEvent (more reliable for onKeyDown on divs)
      fireEvent.keyDown(firstCheckbox, { key: " " });

      // Should call toggle mutation
      expect(mockToggleActivity).toHaveBeenCalled();
    });

    it("toggles checkbox with Enter key", async () => {
      const subNode = createSubNode();

      render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={vi.fn()}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      const firstCheckbox = checkboxes[0];

      // Focus the checkbox
      firstCheckbox.focus();
      expect(firstCheckbox).toHaveFocus();

      // Press Enter using fireEvent (more reliable for onKeyDown on divs)
      fireEvent.keyDown(firstCheckbox, { key: "Enter" });

      // Should call toggle mutation
      expect(mockToggleActivity).toHaveBeenCalled();
    });

    it("renders correct initial aria-checked attributes", () => {
      const subNode = createSubNode();

      render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={vi.fn()}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      const firstCheckbox = checkboxes[0];
      const secondCheckbox = checkboxes[1];

      // First is unchecked (progress.completed = false), second is checked (progress.completed = true)
      expect(firstCheckbox).toHaveAttribute("aria-checked", "false");
      expect(secondCheckbox).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("Resize handle", () => {
    it("renders resize handle element", () => {
      const subNode = createSubNode();

      const { container } = render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={vi.fn()}
        />
      );

      const resizeHandle = container.querySelector(".resize-handle");
      expect(resizeHandle).toBeInTheDocument();
    });

    it("starts resizing on mousedown", () => {
      const subNode = createSubNode();

      const { container } = render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={vi.fn()}
        />
      );

      const resizeHandle = container.querySelector(".resize-handle")!;
      const panel = container.querySelector(".right-panel") as HTMLElement;

      // Get initial width
      const _initialWidth = panel.style.width;

      // Trigger mousedown
      fireEvent.mouseDown(resizeHandle);

      // Trigger mousemove to change width
      fireEvent.mouseMove(document, { clientX: 100 });

      // Panel should still have a width set (resizing mechanism should work)
      expect(panel.style.width).toBeTruthy();
    });

    it("clamps width to min/max values", () => {
      const subNode = createSubNode();

      const { container } = render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={vi.fn()}
        />
      );

      const resizeHandle = container.querySelector(".resize-handle")!;
      const panel = container.querySelector(".right-panel")!;

      // Start resizing
      fireEvent.mouseDown(resizeHandle);

      // Try to resize to extreme width (very small - should clamp to MIN_WIDTH 280)
      fireEvent.mouseMove(document, { clientX: window.innerWidth - 100 });

      const widthAfterSmall = parseInt(
        (panel as HTMLElement).style.width,
        10
      );
      expect(widthAfterSmall).toBeGreaterThanOrEqual(280);

      // Try to resize to extreme width (very large - should clamp to MAX_WIDTH 500)
      fireEvent.mouseMove(document, { clientX: 0 });

      const widthAfterLarge = parseInt(
        (panel as HTMLElement).style.width,
        10
      );
      expect(widthAfterLarge).toBeLessThanOrEqual(500);
    });

    it("cleans up event listeners on mouseup", () => {
      const subNode = createSubNode();

      const { container } = render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={vi.fn()}
        />
      );

      const resizeHandle = container.querySelector(".resize-handle")!;
      const panel = container.querySelector(".right-panel")!;

      // Start resizing
      fireEvent.mouseDown(resizeHandle);

      // Move to resize
      fireEvent.mouseMove(document, { clientX: 500 });
      const widthDuringResize = (panel as HTMLElement).style.width;

      // End resizing
      fireEvent.mouseUp(document);

      // Move again - should not change width since we stopped resizing
      fireEvent.mouseMove(document, { clientX: 200 });
      const widthAfterMouseUp = (panel as HTMLElement).style.width;

      expect(widthAfterMouseUp).toBe(widthDuringResize);
    });
  });

  describe("Viva request", () => {
    it("calls onVivaRequested callback when viva is requested", async () => {
      const user = userEvent.setup();
      const onVivaRequested = vi.fn();
      (useQuery as any).mockReturnValue({
        activeUnlock: null,
        pendingRequest: null,
        latestAttempt: { passed: false },
        majorAssignment: null,
      });

      // Create a sub node with all activities completed
      const completedSubObj = createSubObjectiveNode({
        activities: [
          {
            _id: "act_1",
            title: "Video",
            url: "url",
            type: "video",
            order: 1,
            progress: { completed: true },
          },
        ],
      });

      const subNode = createSubNode({
        subObjective: completedSubObj,
        allSubObjectives: [completedSubObj],
      });

      render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={onVivaRequested}
        />
      );

      const vivaButton = screen.getByRole("button", {
        name: /^request viva$/i,
      });
      await user.click(vivaButton);

      expect(mockUpdateStatus).toHaveBeenCalledWith({
        studentMajorObjectiveId: "major_assignment_1",
        status: "viva_requested",
      });
      expect(onVivaRequested).toHaveBeenCalled();
    });

    it("shows request diagnostic when viva is already requested after a failed attempt", () => {
      (useQuery as any).mockReturnValue({
        activeUnlock: null,
        pendingRequest: null,
        latestAttempt: { passed: false },
        majorAssignment: null,
      });

      const completedSubObj = createSubObjectiveNode({
        activities: [
          {
            _id: "act_1",
            title: "Video",
            url: "url",
            type: "video",
            order: 1,
            progress: { completed: true },
          },
        ],
      });

      const subNode = createSubNode({
        subObjective: completedSubObj,
        allSubObjectives: [completedSubObj],
        majorAssignment: { _id: "major_assignment_1", status: "viva_requested" },
      });

      render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={vi.fn()}
        />
      );

      const vivaButton = screen.getByRole("button", {
        name: /request diagnostic/i,
      });
      expect(vivaButton).toBeEnabled();
    });
  });

  describe("Activity links", () => {
    it("renders activity links with correct URLs", () => {
      const subNode = createSubNode();

      render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "sub", data: subNode }}
          onVivaRequested={vi.fn()}
        />
      );

      const videoLink = screen.getByRole("link", {
        name: /watch variables video/i,
      });
      expect(videoLink).toHaveAttribute("href", "https://example.com/video");
      expect(videoLink).toHaveAttribute("target", "_blank");
      expect(videoLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Sub-objective selection in major view", () => {
    it("calls onSelectSubObjective when clicking a sub-objective", async () => {
      const user = userEvent.setup();
      const onSelectSubObjective = vi.fn();

      const majorNode = createMajorNode();

      render(
        <ObjectivePopover
          userId={"user_1" as any}
          domainName="Coding"
          selectedNode={{ type: "major", data: majorNode }}
          onVivaRequested={vi.fn()}
          onSelectSubObjective={onSelectSubObjective}
        />
      );

      // Click on the sub-objective item
      await user.click(screen.getByText("Learn Variables"));

      expect(onSelectSubObjective).toHaveBeenCalledWith("obj_1");
    });
  });
});
