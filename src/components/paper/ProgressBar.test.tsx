/**
 * Tests for ProgressBar component.
 *
 * The ProgressBar displays progress with clamping behavior
 * and consistent label rendering.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock framer-motion - use animate prop as style for testing
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      initial,
      animate,
      transition,
      ...props
    }: any) => (
      <div className={className} style={{ ...style, ...animate }} {...props}>
        {children}
      </div>
    ),
    circle: ({
      className,
      style,
      initial,
      animate,
      transition,
      ...props
    }: any) => <circle className={className} style={{ ...style, ...animate }} {...props} />,
  },
}));

// Import after mocks
import { ProgressBar, CircularProgress } from "./ProgressBar";

describe("ProgressBar", () => {
  describe("Value clamping", () => {
    it("clamps negative values to 0%", () => {
      const { container } = render(<ProgressBar value={-50} showLabel />);

      // Should show 0%
      expect(screen.getByText("0%")).toBeInTheDocument();

      // Progress bar width should be 0%
      const progressFill = container.querySelector(".rounded-full.h-full");
      expect(progressFill).toHaveStyle({ width: "0%" });
    });

    it("clamps values below -100 to 0%", () => {
      render(<ProgressBar value={-500} showLabel />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("clamps values above 100 to 100%", () => {
      render(<ProgressBar value={150} showLabel />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("clamps values above 1000 to 100%", () => {
      render(<ProgressBar value={1500} showLabel />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("handles 0 value correctly", () => {
      const { container } = render(<ProgressBar value={0} showLabel />);

      expect(screen.getByText("0%")).toBeInTheDocument();

      const progressFill = container.querySelector(".rounded-full.h-full");
      expect(progressFill).toHaveStyle({ width: "0%" });
    });

    it("handles 100 value correctly", () => {
      const { container } = render(<ProgressBar value={100} showLabel />);

      expect(screen.getByText("100%")).toBeInTheDocument();

      const progressFill = container.querySelector(".rounded-full.h-full");
      expect(progressFill).toHaveStyle({ width: "100%" });
    });

    it("handles values between 0 and 100 correctly", () => {
      render(<ProgressBar value={50} showLabel />);

      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("rounds percentage display correctly", () => {
      render(<ProgressBar value={33.33} showLabel />);

      // Should round to nearest integer
      expect(screen.getByText("33%")).toBeInTheDocument();
    });

    it("rounds up from .5", () => {
      render(<ProgressBar value={50.5} showLabel />);

      expect(screen.getByText("51%")).toBeInTheDocument();
    });
  });

  describe("Custom max value", () => {
    it("calculates percentage based on custom max", () => {
      render(<ProgressBar value={50} max={200} showLabel />);

      // 50/200 = 25%
      expect(screen.getByText("25%")).toBeInTheDocument();
    });

    it("clamps to 100% when value exceeds max", () => {
      render(<ProgressBar value={300} max={200} showLabel />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("clamps to 0% for negative values with custom max", () => {
      render(<ProgressBar value={-50} max={200} showLabel />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  describe("Label rendering", () => {
    it("shows percentage label when showLabel is true", () => {
      render(<ProgressBar value={75} showLabel />);

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("hides percentage label when showLabel is false", () => {
      render(<ProgressBar value={75} showLabel={false} />);

      expect(screen.queryByText("75%")).not.toBeInTheDocument();
    });

    it("shows custom label when provided", () => {
      render(<ProgressBar value={50} label="Progress" />);

      expect(screen.getByText("Progress")).toBeInTheDocument();
    });

    it("shows both custom label and percentage when both provided", () => {
      render(<ProgressBar value={50} label="Progress" showLabel />);

      expect(screen.getByText("Progress")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("renders label consistently across different values", () => {
      const { rerender } = render(
        <ProgressBar value={0} label="Download" showLabel />
      );

      expect(screen.getByText("Download")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();

      rerender(<ProgressBar value={50} label="Download" showLabel />);
      expect(screen.getByText("Download")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();

      rerender(<ProgressBar value={100} label="Download" showLabel />);
      expect(screen.getByText("Download")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("renders label with clamped percentage values", () => {
      render(<ProgressBar value={-50} label="Loading" showLabel />);

      expect(screen.getByText("Loading")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("applies default variant styles", () => {
      const { container } = render(<ProgressBar value={50} />);

      const progressFill = container.querySelector(".rounded-full.h-full");
      expect(progressFill).toHaveClass("bg-primary-600");
    });

    it("applies success variant styles", () => {
      const { container } = render(<ProgressBar value={50} variant="success" />);

      const progressFill = container.querySelector(".rounded-full.h-full");
      expect(progressFill).toHaveClass("bg-green-500");
    });

    it("applies warning variant styles", () => {
      const { container } = render(<ProgressBar value={50} variant="warning" />);

      const progressFill = container.querySelector(".rounded-full.h-full");
      expect(progressFill).toHaveClass("bg-yellow-500");
    });

    it("applies danger variant styles", () => {
      const { container } = render(<ProgressBar value={50} variant="danger" />);

      const progressFill = container.querySelector(".rounded-full.h-full");
      expect(progressFill).toHaveClass("bg-red-500");
    });

    it("applies gradient variant styles", () => {
      const { container } = render(<ProgressBar value={50} variant="gradient" />);

      const progressFill = container.querySelector(".rounded-full.h-full");
      expect(progressFill).toHaveClass("bg-gradient-to-r");
    });
  });

  describe("Sizes", () => {
    it("applies small size class", () => {
      const { container } = render(<ProgressBar value={50} size="sm" />);

      const track = container.querySelector(".w-full.bg-gray-200");
      expect(track).toHaveClass("h-1.5");
    });

    it("applies medium size class by default", () => {
      const { container } = render(<ProgressBar value={50} />);

      const track = container.querySelector(".w-full.bg-gray-200");
      expect(track).toHaveClass("h-2.5");
    });

    it("applies large size class", () => {
      const { container } = render(<ProgressBar value={50} size="lg" />);

      const track = container.querySelector(".w-full.bg-gray-200");
      expect(track).toHaveClass("h-4");
    });
  });

  describe("Animation", () => {
    it("applies animated initial state by default", () => {
      // Animation is handled by framer-motion's initial/animate props
      // We just verify the component renders without errors
      const { container } = render(<ProgressBar value={50} />);

      const progressFill = container.querySelector(".rounded-full.h-full");
      expect(progressFill).toBeInTheDocument();
    });

    it("can disable animation", () => {
      const { container } = render(<ProgressBar value={50} animated={false} />);

      const progressFill = container.querySelector(".rounded-full.h-full");
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("applies custom className to container", () => {
      const { container } = render(
        <ProgressBar value={50} className="custom-progress" />
      );

      const wrapper = container.querySelector(".custom-progress");
      expect(wrapper).toBeInTheDocument();
    });

    it("maintains default classes with custom className", () => {
      const { container } = render(
        <ProgressBar value={50} className="custom-progress" />
      );

      const wrapper = container.querySelector(".custom-progress");
      expect(wrapper).toHaveClass("w-full");
    });
  });

  describe("Ref forwarding", () => {
    it("forwards ref to container element", () => {
      const ref = { current: null as HTMLDivElement | null };

      render(<ProgressBar value={50} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("Edge cases", () => {
    it("handles NaN gracefully", () => {
      // NaN / max = NaN - component should render without crashing
      const { container } = render(<ProgressBar value={NaN} showLabel />);

      // Component should still render the progress fill element
      const progressFill = container.querySelector(".rounded-full.h-full");
      expect(progressFill).toBeInTheDocument();
    });

    it("handles zero max value", () => {
      // Division by zero would give Infinity, which should clamp to 100%
      render(<ProgressBar value={50} max={0} showLabel />);

      // 50/0 = Infinity, clamped to 100%
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("handles negative max value", () => {
      // Negative max makes the percentage negative, which should clamp to 0%
      render(<ProgressBar value={50} max={-100} showLabel />);

      // 50/-100 = -50%, clamped to 0%
      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });
});

describe("CircularProgress", () => {
  describe("Value clamping", () => {
    it("clamps negative values to 0%", () => {
      render(<CircularProgress value={-50} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("clamps values above 100 to 100%", () => {
      render(<CircularProgress value={150} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("handles 0 value correctly", () => {
      render(<CircularProgress value={0} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("handles 100 value correctly", () => {
      render(<CircularProgress value={100} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("Label display", () => {
    it("shows label by default", () => {
      render(<CircularProgress value={75} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("hides label when showLabel is false", () => {
      render(<CircularProgress value={75} showLabel={false} />);

      expect(screen.queryByText("75%")).not.toBeInTheDocument();
    });

    it("rounds percentage correctly", () => {
      render(<CircularProgress value={33.33} />);

      expect(screen.getByText("33%")).toBeInTheDocument();
    });
  });

  describe("Custom max value", () => {
    it("calculates percentage based on custom max", () => {
      render(<CircularProgress value={50} max={200} />);

      expect(screen.getByText("25%")).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("renders with default variant", () => {
      const { container } = render(<CircularProgress value={50} />);

      // Check SVG exists
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders with success variant", () => {
      const { container } = render(
        <CircularProgress value={50} variant="success" />
      );

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders with warning variant", () => {
      const { container } = render(
        <CircularProgress value={50} variant="warning" />
      );

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders with danger variant", () => {
      const { container } = render(
        <CircularProgress value={50} variant="danger" />
      );

      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Size and stroke", () => {
    it("renders with default size", () => {
      const { container } = render(<CircularProgress value={50} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "80");
      expect(svg).toHaveAttribute("height", "80");
    });

    it("renders with custom size", () => {
      const { container } = render(<CircularProgress value={50} size={120} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "120");
      expect(svg).toHaveAttribute("height", "120");
    });

    it("renders with default stroke width", () => {
      const { container } = render(<CircularProgress value={50} />);

      const circles = container.querySelectorAll("circle");
      circles.forEach((circle) => {
        expect(circle).toHaveAttribute("stroke-width", "8");
      });
    });

    it("renders with custom stroke width", () => {
      const { container } = render(
        <CircularProgress value={50} strokeWidth={12} />
      );

      const circles = container.querySelectorAll("circle");
      circles.forEach((circle) => {
        expect(circle).toHaveAttribute("stroke-width", "12");
      });
    });
  });
});
