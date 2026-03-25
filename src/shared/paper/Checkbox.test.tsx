/**
 * Tests for Checkbox component.
 *
 * The Checkbox provides an accessible input with label,
 * description, and animated checkmark.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    svg: ({ children, className, animate, initial, transition, ...props }: any) => (
      <svg className={className} {...props}>
        {children}
      </svg>
    ),
  },
}));

// Import after mocks
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders an unchecked checkbox by default", () => {
      render(<Checkbox />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it("renders a checked checkbox when checked prop is true", () => {
      render(<Checkbox checked onChange={() => {}} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("renders with a label", () => {
      render(<Checkbox label="Accept terms" />);

      expect(screen.getByLabelText("Accept terms")).toBeInTheDocument();
      expect(screen.getByText("Accept terms")).toBeInTheDocument();
    });

    it("renders with a description", () => {
      render(
        <Checkbox
          label="Newsletter"
          description="Receive weekly updates via email"
        />
      );

      expect(
        screen.getByText("Receive weekly updates via email")
      ).toBeInTheDocument();
    });

    it("renders both label and description", () => {
      render(
        <Checkbox
          label="Enable notifications"
          description="You will receive push notifications"
        />
      );

      expect(screen.getByText("Enable notifications")).toBeInTheDocument();
      expect(
        screen.getByText("You will receive push notifications")
      ).toBeInTheDocument();
    });

    it("renders without label or description", () => {
      render(<Checkbox />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
      // Should not render the label/description container
      expect(screen.queryByRole("label")).not.toBeInTheDocument();
    });
  });

  describe("Keyboard interactions", () => {
    it("can be toggled with Space key", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Checkbox label="Toggle me" onChange={onChange} />);

      const checkbox = screen.getByRole("checkbox");
      checkbox.focus();
      expect(checkbox).toHaveFocus();

      await user.keyboard(" ");

      expect(onChange).toHaveBeenCalled();
    });

    it("can be focused with Tab key", async () => {
      const user = userEvent.setup();

      render(
        <>
          <button>Before</button>
          <Checkbox label="Focus me" />
          <button>After</button>
        </>
      );

      await user.tab(); // Focus "Before" button
      await user.tab(); // Focus checkbox

      expect(screen.getByRole("checkbox")).toHaveFocus();
    });

    it("can navigate between checkboxes with Tab", async () => {
      const user = userEvent.setup();

      render(
        <>
          <Checkbox label="First" />
          <Checkbox label="Second" />
        </>
      );

      await user.tab(); // Focus first checkbox
      expect(screen.getByLabelText("First")).toHaveFocus();

      await user.tab(); // Focus second checkbox
      expect(screen.getByLabelText("Second")).toHaveFocus();
    });

    it("supports Enter key for form submission context", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Checkbox label="Submit with Enter" onChange={onChange} />);

      const checkbox = screen.getByRole("checkbox");
      checkbox.focus();

      // Note: Enter key on checkbox typically doesn't toggle,
      // but we test that it doesn't break anything
      await user.keyboard("{Enter}");

      // Checkbox should still be focusable
      expect(checkbox).toHaveFocus();
    });
  });

  describe("Checked state correctness", () => {
    it("is unchecked by default", () => {
      render(<Checkbox label="Unchecked" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
    });

    it("is checked when checked prop is true", () => {
      render(<Checkbox label="Checked" checked onChange={() => {}} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("updates checked state when toggled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      const { rerender } = render(
        <Checkbox label="Toggle" checked={false} onChange={onChange} />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(onChange).toHaveBeenCalled();

      // Simulate parent updating state
      rerender(<Checkbox label="Toggle" checked={true} onChange={onChange} />);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(onChange).toHaveBeenCalledTimes(2);

      // Simulate parent updating state back
      rerender(<Checkbox label="Toggle" checked={false} onChange={onChange} />);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe("Controlled vs Uncontrolled", () => {
    it("works as uncontrolled checkbox", async () => {
      const user = userEvent.setup();

      render(<Checkbox label="Uncontrolled" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it("works as controlled checkbox", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      const { rerender } = render(
        <Checkbox label="Controlled" checked={false} onChange={onChange} />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(onChange).toHaveBeenCalled();

      // Simulate parent updating state
      rerender(
        <Checkbox label="Controlled" checked={true} onChange={onChange} />
      );
      expect(checkbox).toBeChecked();
    });
  });

  describe("Disabled state", () => {
    it("can be disabled", () => {
      render(<Checkbox label="Disabled" disabled />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeDisabled();
    });

    it("does not call onChange when disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Checkbox label="Disabled" disabled onChange={onChange} />);

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("applies disabled styles", () => {
      render(<Checkbox label="Disabled" disabled />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("disabled:opacity-50");
      expect(checkbox).toHaveClass("disabled:cursor-not-allowed");
    });
  });

  describe("Label association", () => {
    it("associates label with checkbox via htmlFor", () => {
      render(<Checkbox label="Click label" id="my-checkbox" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("id", "my-checkbox");

      const label = screen.getByText("Click label");
      expect(label).toHaveAttribute("for", "my-checkbox");
    });

    it("generates unique id when not provided", () => {
      render(<Checkbox label="Auto ID" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("id");
      expect(checkbox.id).toMatch(/^checkbox-/);
    });

    it("clicking label toggles checkbox", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Checkbox label="Click me" onChange={onChange} />);

      await user.click(screen.getByText("Click me"));

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      render(<Checkbox className="custom-class" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("custom-class");
    });

    it("maintains default classes with custom className", () => {
      render(<Checkbox className="custom-class" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("custom-class");
      expect(checkbox).toHaveClass("peer");
      expect(checkbox).toHaveClass("h-5");
      expect(checkbox).toHaveClass("w-5");
    });

    it("has focus ring styles", () => {
      render(<Checkbox label="Focus styles" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("focus:outline-none");
      expect(checkbox).toHaveClass("focus:ring-2");
      expect(checkbox).toHaveClass("focus:ring-primary-500");
    });

    it("has checked state styles", () => {
      render(<Checkbox label="Checked styles" checked onChange={() => {}} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("checked:bg-primary-600");
      expect(checkbox).toHaveClass("checked:border-primary-600");
    });
  });

  describe("Form integration", () => {
    it("supports name attribute", () => {
      render(<Checkbox label="Named" name="consent" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("name", "consent");
    });

    it("supports value attribute", () => {
      render(<Checkbox label="Valued" value="yes" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("value", "yes");
    });

    it("supports required attribute", () => {
      render(<Checkbox label="Required" required />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeRequired();
    });
  });

  describe("Ref forwarding", () => {
    it("forwards ref to input element", () => {
      const ref = { current: null as HTMLInputElement | null };

      render(<Checkbox label="Ref test" ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe("checkbox");
    });

    it("ref can be used to focus programmatically", () => {
      const ref = { current: null as HTMLInputElement | null };

      render(<Checkbox label="Focus test" ref={ref} />);

      ref.current?.focus();

      expect(ref.current).toHaveFocus();
    });
  });

  describe("Animated checkmark", () => {
    it("renders checkmark SVG", () => {
      render(<Checkbox label="Has checkmark" checked onChange={() => {}} />);

      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("checkmark is always in DOM (visibility controlled by framer-motion)", () => {
      render(<Checkbox label="Unchecked" />);

      // SVG should be present even when unchecked (framer-motion controls opacity)
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });
});
