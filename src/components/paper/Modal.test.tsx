/**
 * Tests for Modal component.
 *
 * The Modal provides a dialog overlay with keyboard support,
 * focus trapping, and customizable closing behaviors.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock framer-motion to simplify testing
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, onClick, ...props }: any) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Import after mocks
import { Modal } from "./Modal";

describe("Modal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = "unset";
  });

  describe("Rendering", () => {
    it("renders children when open", () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText("Modal content")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
    });

    it("renders title when provided", () => {
      render(<Modal {...defaultProps} title="Modal Title" />);

      expect(screen.getByText("Modal Title")).toBeInTheDocument();
    });

    it("renders footer when provided", () => {
      render(
        <Modal
          {...defaultProps}
          footer={<button>Footer Action</button>}
        />
      );

      expect(
        screen.getByRole("button", { name: "Footer Action" })
      ).toBeInTheDocument();
    });

    it("renders close button by default", () => {
      render(<Modal {...defaultProps} title="Title" />);

      expect(
        screen.getByRole("button", { name: "Close modal" })
      ).toBeInTheDocument();
    });

    it("hides close button when showCloseButton is false", () => {
      render(<Modal {...defaultProps} title="Title" showCloseButton={false} />);

      expect(
        screen.queryByRole("button", { name: "Close modal" })
      ).not.toBeInTheDocument();
    });
  });

  describe("Size variants", () => {
    it("applies small size class", () => {
      const { container } = render(<Modal {...defaultProps} size="sm" />);

      const modal = container.querySelector(".max-w-sm");
      expect(modal).toBeInTheDocument();
    });

    it("applies medium size class by default", () => {
      const { container } = render(<Modal {...defaultProps} />);

      const modal = container.querySelector(".max-w-md");
      expect(modal).toBeInTheDocument();
    });

    it("applies large size class", () => {
      const { container } = render(<Modal {...defaultProps} size="lg" />);

      const modal = container.querySelector(".max-w-lg");
      expect(modal).toBeInTheDocument();
    });

    it("applies extra large size class", () => {
      const { container } = render(<Modal {...defaultProps} size="xl" />);

      const modal = container.querySelector(".max-w-xl");
      expect(modal).toBeInTheDocument();
    });

    it("applies full size class", () => {
      const { container } = render(<Modal {...defaultProps} size="full" />);

      const modal = container.querySelector(".max-w-4xl");
      expect(modal).toBeInTheDocument();
    });
  });

  describe("Close button behavior", () => {
    it("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} title="Title" />);

      await user.click(screen.getByRole("button", { name: "Close modal" }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Escape key behavior", () => {
    it("calls onClose when Escape is pressed", () => {
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when closeOnEscape is false", () => {
      const onClose = vi.fn();

      render(
        <Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />
      );

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("does not respond to other keys", () => {
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: "Enter" });
      fireEvent.keyDown(document, { key: "Tab" });
      fireEvent.keyDown(document, { key: "a" });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Backdrop click behavior", () => {
    it("calls onClose when clicking backdrop", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      // Click on the backdrop (the flex container that centers the modal)
      const backdrop = document.querySelector(
        ".flex.min-h-full.items-center.justify-center"
      );
      await user.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when clicking modal content", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText("Modal content"));

      expect(onClose).not.toHaveBeenCalled();
    });

    it("does not call onClose when closeOnBackdropClick is false", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Modal
          {...defaultProps}
          onClose={onClose}
          closeOnBackdropClick={false}
        />
      );

      const backdrop = document.querySelector(
        ".flex.min-h-full.items-center.justify-center"
      );
      await user.click(backdrop!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Body scroll locking", () => {
    it("locks body scroll when modal opens", () => {
      render(<Modal {...defaultProps} />);

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("restores body scroll when modal closes", () => {
      const { rerender } = render(<Modal {...defaultProps} />);

      expect(document.body.style.overflow).toBe("hidden");

      rerender(<Modal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe("unset");
    });

    it("cleans up body scroll on unmount", () => {
      const { unmount } = render(<Modal {...defaultProps} />);

      expect(document.body.style.overflow).toBe("hidden");

      unmount();

      expect(document.body.style.overflow).toBe("unset");
    });
  });

  describe("Event listener cleanup", () => {
    it("removes keydown listener when modal closes", () => {
      const onClose = vi.fn();
      const { rerender } = render(<Modal {...defaultProps} onClose={onClose} />);

      // First, ensure Escape works when open
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);

      // Close the modal
      rerender(<Modal {...defaultProps} isOpen={false} onClose={onClose} />);

      // Now Escape should not trigger onClose again
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });

  describe("Header rendering logic", () => {
    it("renders header when only title is provided", () => {
      render(
        <Modal {...defaultProps} title="Just Title" showCloseButton={false} />
      );

      expect(screen.getByText("Just Title")).toBeInTheDocument();
      // Header border should exist
      const header = document.querySelector(".border-b");
      expect(header).toBeInTheDocument();
    });

    it("renders header when only close button is shown", () => {
      render(<Modal {...defaultProps} showCloseButton={true} />);

      expect(
        screen.getByRole("button", { name: "Close modal" })
      ).toBeInTheDocument();
    });

    it("does not render header when no title and no close button", () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);

      const header = document.querySelector(".border-b.border-gray-100");
      expect(header).not.toBeInTheDocument();
    });
  });

  describe("Content rendering", () => {
    it("renders complex children correctly", () => {
      render(
        <Modal {...defaultProps}>
          <div>
            <h1>Heading</h1>
            <p>Paragraph text</p>
            <button>Action</button>
          </div>
        </Modal>
      );

      expect(screen.getByText("Heading")).toBeInTheDocument();
      expect(screen.getByText("Paragraph text")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    });

    it("renders multiple footer buttons", () => {
      render(
        <Modal
          {...defaultProps}
          footer={
            <>
              <button>Cancel</button>
              <button>Confirm</button>
            </>
          }
        />
      );

      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has appropriate aria-label on close button", () => {
      render(<Modal {...defaultProps} title="Title" />);

      expect(
        screen.getByRole("button", { name: "Close modal" })
      ).toHaveAttribute("aria-label", "Close modal");
    });

    it("renders title as h2 for proper heading hierarchy", () => {
      render(<Modal {...defaultProps} title="Modal Title" />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Modal Title");
    });
  });

  describe("Combined behaviors", () => {
    it("handles all close methods simultaneously", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} title="Title" />);

      // Close via button
      await user.click(screen.getByRole("button", { name: "Close modal" }));
      expect(onClose).toHaveBeenCalledTimes(1);

      // Reset and test Escape
      onClose.mockClear();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);

      // Reset and test backdrop
      onClose.mockClear();
      const backdrop = document.querySelector(
        ".flex.min-h-full.items-center.justify-center"
      );
      await user.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("can disable all close methods", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Modal
          {...defaultProps}
          onClose={onClose}
          showCloseButton={false}
          closeOnEscape={false}
          closeOnBackdropClick={false}
        />
      );

      // Try Escape
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).not.toHaveBeenCalled();

      // Try backdrop click
      const backdrop = document.querySelector(
        ".flex.min-h-full.items-center.justify-center"
      );
      await user.click(backdrop!);
      expect(onClose).not.toHaveBeenCalled();

      // No close button to click
      expect(
        screen.queryByRole("button", { name: "Close modal" })
      ).not.toBeInTheDocument();
    });
  });
});
