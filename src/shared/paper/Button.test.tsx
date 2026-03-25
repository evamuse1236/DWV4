import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  // --- Happy Path Tests ---
  it("disables the button and shows spinner when loading", () => {
    render(<Button isLoading>Save</Button>);
    const button = screen.getByRole("button", { name: /save/i });
    expect(button).toBeDisabled();
    expect(button.querySelector("svg.animate-spin")).toBeTruthy();
  });

  it("adds full width class when fullWidth=true", () => {
    render(<Button fullWidth>Wide</Button>);
    expect(screen.getByRole("button", { name: /wide/i })).toHaveClass("w-full");
  });

  // --- Error State / Edge Case Tests ---

  describe("disabled state", () => {
    it("disables the button when disabled prop is true", () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button", { name: /disabled/i })).toBeDisabled();
    });

    it("prevents click handler from being called when disabled", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button disabled onClick={onClick}>
          Click Me
        </Button>
      );

      await user.click(screen.getByRole("button", { name: /click me/i }));

      expect(onClick).not.toHaveBeenCalled();
    });

    it("prevents click handler from being called when loading", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button isLoading onClick={onClick}>
          Loading
        </Button>
      );

      await user.click(screen.getByRole("button", { name: /loading/i }));

      expect(onClick).not.toHaveBeenCalled();
    });

    it("applies disabled opacity class when disabled", () => {
      render(<Button disabled>Faded</Button>);
      expect(screen.getByRole("button", { name: /faded/i })).toHaveClass(
        "disabled:opacity-50"
      );
    });
  });

  describe("variants", () => {
    it("applies danger variant styles", () => {
      render(<Button variant="danger">Delete</Button>);
      const button = screen.getByRole("button", { name: /delete/i });
      expect(button).toHaveClass("bg-red-600");
    });

    it("applies success variant styles", () => {
      render(<Button variant="success">Confirm</Button>);
      const button = screen.getByRole("button", { name: /confirm/i });
      expect(button).toHaveClass("bg-green-600");
    });

    it("applies ghost variant styles", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button", { name: /ghost/i });
      expect(button).toHaveClass("bg-transparent");
    });

    it("applies outline variant styles", () => {
      render(<Button variant="outline">Outlined</Button>);
      const button = screen.getByRole("button", { name: /outlined/i });
      expect(button).toHaveClass("border-2");
      expect(button).toHaveClass("border-primary-600");
    });

    it("applies secondary variant styles", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button", { name: /secondary/i });
      expect(button).toHaveClass("bg-gray-100");
    });
  });

  describe("sizes", () => {
    it("applies small size class", () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole("button", { name: /small/i });
      expect(button).toHaveClass("px-3");
      expect(button).toHaveClass("py-1.5");
      expect(button).toHaveClass("text-sm");
    });

    it("applies large size class", () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole("button", { name: /large/i });
      expect(button).toHaveClass("px-6");
      expect(button).toHaveClass("py-3");
      expect(button).toHaveClass("text-lg");
    });

    it("applies extra large size class", () => {
      render(<Button size="xl">Extra Large</Button>);
      const button = screen.getByRole("button", { name: /extra large/i });
      expect(button).toHaveClass("px-8");
      expect(button).toHaveClass("py-4");
      expect(button).toHaveClass("text-xl");
    });
  });

  describe("icons", () => {
    it("renders left icon when not loading", () => {
      render(
        <Button leftIcon={<span data-testid="left-icon">←</span>}>
          Back
        </Button>
      );
      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    });

    it("hides left icon when loading", () => {
      render(
        <Button isLoading leftIcon={<span data-testid="left-icon">←</span>}>
          Back
        </Button>
      );
      expect(screen.queryByTestId("left-icon")).not.toBeInTheDocument();
    });

    it("renders right icon alongside spinner when loading", () => {
      render(
        <Button isLoading rightIcon={<span data-testid="right-icon">→</span>}>
          Next
        </Button>
      );
      // Right icon should still be visible even when loading
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
      // Spinner should also be present
      const button = screen.getByRole("button", { name: /next/i });
      expect(button.querySelector("svg.animate-spin")).toBeTruthy();
    });

    it("renders both icons when provided", () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Navigate
        </Button>
      );
      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });
  });

  describe("click handling", () => {
    it("calls onClick handler when clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Button onClick={onClick}>Click Me</Button>);

      await user.click(screen.getByRole("button", { name: /click me/i }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("passes event to onClick handler", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Button onClick={onClick}>Click Me</Button>);

      await user.click(screen.getByRole("button", { name: /click me/i }));

      // Verify the event object was passed
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({}));
    });
  });

  describe("accessibility", () => {
    it("can be focused with keyboard", async () => {
      const user = userEvent.setup();
      render(<Button>Focusable</Button>);

      await user.tab();

      expect(screen.getByRole("button", { name: /focusable/i })).toHaveFocus();
    });

    it("applies custom className alongside default classes", () => {
      render(<Button className="my-custom-class">Custom</Button>);
      const button = screen.getByRole("button", { name: /custom/i });
      expect(button).toHaveClass("my-custom-class");
      expect(button).toHaveClass("rounded-lg"); // Default class still present
    });
  });

  describe("button type", () => {
    it("defaults to button type to prevent form submission", () => {
      render(<Button>Default Type</Button>);
      // Check that button doesn't have type="submit" by default
      const button = screen.getByRole("button", { name: /default type/i });
      expect(button).not.toHaveAttribute("type", "submit");
    });

    it("accepts type prop override", () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole("button", { name: /submit/i });
      expect(button).toHaveAttribute("type", "submit");
    });
  });
});

