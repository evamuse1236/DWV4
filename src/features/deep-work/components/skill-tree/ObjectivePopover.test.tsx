import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mockToggleActivity = vi.fn().mockResolvedValue({});

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((mutation: string) => {
    if (mutation === "progress.toggleActivity") return mockToggleActivity;
    return vi.fn().mockResolvedValue({});
  }),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    progress: { toggleActivity: "progress.toggleActivity" },
    assignments: {
      getAssignmentState: "assignments.getAssignmentState",
      submitWork: "assignments.submitWork",
    },
  },
}));

vi.mock("@/shared/lib/skill-tree-utils", () => ({
  getDomainConfig: vi.fn(() => ({ color: "#FEF9C3" })),
}));

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
    "resize-handle": "resize-handle",
    active: "active",
  },
}));

vi.mock("@phosphor-icons/react", () => ({
  Play: () => <span>Play</span>,
  PencilLine: () => <span>Pencil</span>,
  BookOpen: () => <span>Book</span>,
  FolderOpen: () => <span>Folder</span>,
  GameController: () => <span>Game</span>,
  Circle: () => <span>Circle</span>,
  Check: () => <span>Check</span>,
}));

import { useQuery } from "convex/react";
import { ObjectivePopover } from "./ObjectivePopover";

const assignmentState = {
  studentMajorObjectiveId: "major_assignment_1",
  majorObjective: { _id: "major_1", title: "Programming Basics" },
  domain: { _id: "domain_1", name: "Coding" },
  status: "rejected",
  rawStatus: "rejected",
  work: {
    totalSubObjectives: 1,
    completedSubObjectives: 1,
    allWorkComplete: true,
  },
  confirmationNotes: "Explain variables in your own words.",
};

const subNode = {
  majorObjective: {
    _id: "major_1" as any,
    title: "Programming Basics",
    description: "Master the fundamentals of programming",
  },
  subObjective: {
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
  },
  majorAssignment: {
    _id: "major_assignment_1" as any,
    status: "in_progress",
  },
  allSubObjectives: [],
};

const majorNode = {
  majorObjective: {
    _id: "major_1" as any,
    title: "Programming Basics",
    description: "Master the fundamentals of programming",
  },
  assignment: {
    _id: "major_assignment_1" as any,
    status: "in_progress",
  },
  subObjectives: [
    {
      _id: "student_obj_1" as any,
      objectiveId: "obj_1" as any,
      status: "completed",
      objective: {
        _id: "obj_1" as any,
        title: "Learn Variables",
        description: "Understand how variables work in programming",
        difficulty: "beginner",
      },
      activities: [],
    },
  ],
};

describe("ObjectivePopover", () => {
  const renderPopover = (props: React.ComponentProps<typeof ObjectivePopover>) =>
    render(
      <MemoryRouter>
        <ObjectivePopover {...props} />
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as any).mockImplementation((query: string) => {
      if (query === "assignments.getAssignmentState") return assignmentState;
      return undefined;
    });
  });

  it("returns null when no node is selected", () => {
    const { container } = renderPopover(
      { userId: "user_1" as any, domainName: "Coding", selectedNode: null }
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the assignment summary inside the major view", () => {
    renderPopover({
      userId: "user_1" as any,
      domainName: "Coding",
      selectedNode: { type: "major", data: majorNode },
    });

    expect(screen.getByText("Programming Basics")).toBeInTheDocument();
    expect(screen.getByText("Coach note")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open assignment/i })).toHaveAttribute(
      "href",
      "/deep-work/mastery/major_1"
    );
  });

  it("renders activities for a sub-objective", () => {
    renderPopover({
      userId: "user_1" as any,
      domainName: "Coding",
      selectedNode: { type: "sub", data: subNode },
    });

    expect(screen.getByText("Watch Variables Video")).toBeInTheDocument();
    expect(screen.getByText("Complete Variables Exercise")).toBeInTheDocument();
  });

  it("toggles an activity checkbox", async () => {
    const user = userEvent.setup();
    renderPopover({
      userId: "user_1" as any,
      domainName: "Coding",
      selectedNode: { type: "sub", data: subNode },
    });

    const firstCheckbox = screen.getAllByRole("checkbox")[0];
    await user.click(firstCheckbox);

    expect(mockToggleActivity).toHaveBeenCalledWith({
      userId: "user_1",
      activityId: "act_1",
      studentObjectiveId: "student_obj_1",
    });
  });

  it("calls sub-objective selection in major view", async () => {
    const user = userEvent.setup();
    const onSelectSubObjective = vi.fn();
    renderPopover({
      userId: "user_1" as any,
      domainName: "Coding",
      selectedNode: { type: "major", data: majorNode },
      onSelectSubObjective,
    });

    await user.click(screen.getByText("Learn Variables"));
    expect(onSelectSubObjective).toHaveBeenCalledWith("obj_1");
  });

  it("keeps the resize handle wired", () => {
    const { container } = renderPopover({
      userId: "user_1" as any,
      domainName: "Coding",
      selectedNode: { type: "sub", data: subNode },
    });

    const resizeHandle = container.querySelector(".resize-handle");
    expect(resizeHandle).toBeInTheDocument();
    fireEvent.mouseDown(resizeHandle!);
  });
});
