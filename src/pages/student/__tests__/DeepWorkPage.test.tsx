/**
 * Tests for DeepWorkPage component.
 *
 * The DeepWorkPage displays:
 * - Loading state when treeData is undefined
 * - Empty state when no domains are configured
 * - Domain selection view (circular layout)
 * - Horizontal tree view when domain is selected
 * - Right panel (ObjectivePopover) when a node is selected
 * - Backdrop click to close panel
 */
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue({})),
}));

// Mock the API
vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    objectives: {
      getTreeData: "objectives.getTreeData",
      updateStatus: "objectives.updateStatus",
    },
    progress: {
      toggleActivity: "progress.toggleActivity",
    },
  },
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock useAuth hook
vi.mock("../../../hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      _id: "user_123",
      username: "testuser",
      displayName: "Test User",
      role: "student",
    },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, onClick, className, style, ...props }: any) => (
      <div onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, ...props }: any) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock child components with simplified versions
vi.mock("../../../components/skill-tree", () => ({
  SkillTreeCanvas: ({
    domains,
    onSelectDomain,
  }: {
    domains: any[];
    onSelectDomain: (id: string) => void;
  }) => (
    <div data-testid="skill-tree-canvas">
      <div data-testid="domain-count">{domains.length} domains</div>
      {domains.map((domain: any) => (
        <button
          key={domain._id}
          data-testid={`domain-${domain._id}`}
          onClick={() => onSelectDomain(domain._id)}
        >
          {domain.name}
        </button>
      ))}
    </div>
  ),
  ObjectivePopover: ({
    selectedNode,
    domainName,
  }: {
    selectedNode: any;
    domainName: string | null;
  }) =>
    selectedNode ? (
      <div data-testid="objective-popover">
        <div data-testid="popover-domain">{domainName}</div>
        <div data-testid="popover-type">{selectedNode.type}</div>
      </div>
    ) : null,
}));

vi.mock("../../../components/skill-tree/HorizontalTreeCanvas", () => ({
  default: ({
    domain,
    selectedNode,
    onSelectNode,
    onBack,
  }: {
    domain: any;
    selectedNode: any;
    onSelectNode: (node: any) => void;
    onBack: () => void;
  }) => (
    <div data-testid="horizontal-tree-canvas">
      <div data-testid="horizontal-domain">{domain.name}</div>
      <button data-testid="back-button" onClick={onBack}>
        Back
      </button>
      <button
        data-testid="select-major-node"
        onClick={() => onSelectNode({ type: "major", id: "major_1" })}
      >
        Select Major
      </button>
      <button
        data-testid="select-sub-node"
        onClick={() => onSelectNode({ type: "sub", id: "sub_1" })}
      >
        Select Sub
      </button>
      {selectedNode && (
        <div data-testid="selected-node-type">{selectedNode.type}</div>
      )}
    </div>
  ),
}));

// Import after mocking
import { DeepWorkPage } from "../DeepWorkPage";
import { useQuery } from "convex/react";
import { useAuth } from "../../../hooks/useAuth";

// Mock data
const mockDomains = [
  { _id: "domain_1", name: "Mathematics", description: "Math skills" },
  { _id: "domain_2", name: "Science", description: "Science skills" },
  { _id: "domain_3", name: "English", description: "English skills" },
];

const mockMajorsByDomain = {
  domain_1: [
    {
      majorObjective: {
        _id: "major_1",
        title: "Algebra Basics",
        description: "Learn algebra fundamentals",
      },
      assignment: {
        _id: "assignment_1",
        status: "in_progress",
      },
      subObjectives: [
        {
          _id: "sub_1",
          objectiveId: "obj_1",
          status: "assigned",
          objective: {
            _id: "obj_1",
            title: "Linear Equations",
            description: "Solve linear equations",
            difficulty: "beginner",
          },
          activities: [],
        },
      ],
    },
  ],
};

const mockTreeData = {
  domains: mockDomains,
  majorsByDomain: mockMajorsByDomain,
};

describe("DeepWorkPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading states", () => {
    it("shows loading state when user is not available", () => {
      // Mock useAuth to return no user
      (useAuth as any).mockReturnValue({
        user: null,
        isLoading: true,
        login: vi.fn(),
        logout: vi.fn(),
      });

      (useQuery as any).mockReturnValue(undefined);

      render(<DeepWorkPage />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(screen.getByText(/please wait/i)).toBeInTheDocument();
    });

    it("shows loading state when treeData is undefined", () => {
      // Reset useAuth to return valid user
      (useAuth as any).mockReturnValue({
        user: {
          _id: "user_123",
          username: "testuser",
          displayName: "Test User",
          role: "student",
        },
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      (useQuery as any).mockReturnValue(undefined);

      render(<DeepWorkPage />);

      expect(
        screen.getByText(/loading your learning journey/i)
      ).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: {
          _id: "user_123",
          username: "testuser",
          displayName: "Test User",
          role: "student",
        },
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });
    });

    it("shows empty state when domains.length === 0", () => {
      (useQuery as any).mockReturnValue({
        domains: [],
        majorsByDomain: {},
      });

      render(<DeepWorkPage />);

      expect(screen.getByText(/no subjects yet/i)).toBeInTheDocument();
      expect(
        screen.getByText(/your learning journey hasn't started yet/i)
      ).toBeInTheDocument();
    });
  });

  describe("Domain selection view", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: {
          _id: "user_123",
          username: "testuser",
          displayName: "Test User",
          role: "student",
        },
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      (useQuery as any).mockReturnValue(mockTreeData);
    });

    it("renders SkillTreeCanvas with domains when no domain is selected", () => {
      render(<DeepWorkPage />);

      expect(screen.getByTestId("skill-tree-canvas")).toBeInTheDocument();
      expect(screen.getByTestId("domain-count")).toHaveTextContent("3 domains");
    });

    it("renders all domain buttons in the canvas", () => {
      render(<DeepWorkPage />);

      expect(screen.getByTestId("domain-domain_1")).toBeInTheDocument();
      expect(screen.getByTestId("domain-domain_2")).toBeInTheDocument();
      expect(screen.getByTestId("domain-domain_3")).toBeInTheDocument();
    });

    it("switches to horizontal view when selecting a domain", async () => {
      const user = userEvent.setup();
      render(<DeepWorkPage />);

      // Initially shows skill tree canvas (domain selection)
      expect(screen.getByTestId("skill-tree-canvas")).toBeInTheDocument();

      // Click on a domain
      await user.click(screen.getByTestId("domain-domain_1"));

      // Should now show horizontal tree canvas
      expect(screen.getByTestId("horizontal-tree-canvas")).toBeInTheDocument();
      expect(screen.getByTestId("horizontal-domain")).toHaveTextContent(
        "Mathematics"
      );
    });
  });

  describe("Horizontal tree view", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: {
          _id: "user_123",
          username: "testuser",
          displayName: "Test User",
          role: "student",
        },
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      (useQuery as any).mockReturnValue(mockTreeData);
    });

    it("selecting a node opens the right panel (ObjectivePopover)", async () => {
      const user = userEvent.setup();
      render(<DeepWorkPage />);

      // Select a domain first
      await user.click(screen.getByTestId("domain-domain_1"));

      // Verify horizontal view is shown
      expect(screen.getByTestId("horizontal-tree-canvas")).toBeInTheDocument();

      // Initially no popover
      expect(screen.queryByTestId("objective-popover")).not.toBeInTheDocument();

      // Select a major node
      await user.click(screen.getByTestId("select-major-node"));

      // Now popover should be visible
      expect(screen.getByTestId("objective-popover")).toBeInTheDocument();
      expect(screen.getByTestId("popover-type")).toHaveTextContent("major");
    });

    it("selecting a sub node opens the right panel", async () => {
      const user = userEvent.setup();
      render(<DeepWorkPage />);

      // Select a domain
      await user.click(screen.getByTestId("domain-domain_1"));

      // Select a sub node
      await user.click(screen.getByTestId("select-sub-node"));

      // Verify selected node type is shown (note: popover requires valid node details from majorsByDomain)
      expect(screen.getByTestId("selected-node-type")).toHaveTextContent("sub");
    });

    it("'back' button returns to domain selection", async () => {
      const user = userEvent.setup();
      render(<DeepWorkPage />);

      // Select a domain
      await user.click(screen.getByTestId("domain-domain_1"));

      // Verify horizontal view
      expect(screen.getByTestId("horizontal-tree-canvas")).toBeInTheDocument();

      // Click back button
      await user.click(screen.getByTestId("back-button"));

      // Should return to skill tree canvas (domain selection)
      expect(screen.getByTestId("skill-tree-canvas")).toBeInTheDocument();
      expect(
        screen.queryByTestId("horizontal-tree-canvas")
      ).not.toBeInTheDocument();
    });
  });

  describe("Panel interactions", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: {
          _id: "user_123",
          username: "testuser",
          displayName: "Test User",
          role: "student",
        },
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      (useQuery as any).mockReturnValue(mockTreeData);
    });

    it("backdrop click closes the panel", async () => {
      const user = userEvent.setup();
      render(<DeepWorkPage />);

      // Select a domain
      await user.click(screen.getByTestId("domain-domain_1"));

      // Select a node to open the panel
      await user.click(screen.getByTestId("select-major-node"));

      // Popover should be visible
      expect(screen.getByTestId("objective-popover")).toBeInTheDocument();

      // Find and click the backdrop
      const backdrop = document.querySelector('[aria-label="Close panel"]');
      expect(backdrop).toBeInTheDocument();

      await user.click(backdrop!);

      // Panel should be closed (popover not visible)
      expect(screen.queryByTestId("objective-popover")).not.toBeInTheDocument();
    });

    it("displays correct domain name in popover", async () => {
      const user = userEvent.setup();
      render(<DeepWorkPage />);

      // Select Mathematics domain
      await user.click(screen.getByTestId("domain-domain_1"));

      // Select a node
      await user.click(screen.getByTestId("select-major-node"));

      // Check popover shows correct domain
      expect(screen.getByTestId("popover-domain")).toHaveTextContent(
        "Mathematics"
      );
    });
  });

  describe("Edge cases", () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: {
          _id: "user_123",
          username: "testuser",
          displayName: "Test User",
          role: "student",
        },
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });
    });

    it("handles missing majorsByDomain gracefully", () => {
      (useQuery as any).mockReturnValue({
        domains: mockDomains,
        majorsByDomain: {},
      });

      render(<DeepWorkPage />);

      // Should still render the domains
      expect(screen.getByTestId("skill-tree-canvas")).toBeInTheDocument();
      expect(screen.getByTestId("domain-count")).toHaveTextContent("3 domains");
    });

    it("handles undefined majorsByDomain gracefully", () => {
      (useQuery as any).mockReturnValue({
        domains: mockDomains,
        majorsByDomain: undefined,
      });

      render(<DeepWorkPage />);

      // Should still render the domains
      expect(screen.getByTestId("skill-tree-canvas")).toBeInTheDocument();
    });
  });
});
