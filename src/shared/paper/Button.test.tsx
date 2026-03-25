import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  function getButton(name: RegExp | string) {
    return screen.getByRole("button", { name });
  }

  it("disables the button and shows spinner when loading", () => {
    render(<Button isLoading>Save</Button>);
    const button = getButton(/save/i);
    expect(button).toBeDisabled();
    expect(button.querySelector("svg.animate-spin")).toBeTruthy();
  });

  it("adds full width class when fullWidth=true", () => {
    render(<Button fullWidth>Wide</Button>);
    expect(getButton(/wide/i)).toHaveClass("w-full");
  });

  describe("disabled state", () => {
    it("disables the button when disabled prop is true", () => {
      render(<Button disabled>Disabled</Button>);
      expect(getButton(/disabled/i)).toBeDisabled();
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
      expect(getButton(/faded/i)).toHaveClass("disabled:opacity-50");
    });
  });

  describe("variants", () => {
    it.each([
      ["danger", "Delete", ["bg-red-600"]],
      ["success", "Confirm", ["bg-green-600"]],
      ["ghost", "Ghost", ["bg-transparent"]],
      ["outline", "Outlined", ["border-2", "border-primary-600"]],
      ["secondary", "Secondary", ["bg-gray-100"]],
    ] as const)("applies %s variant styles", (variant, label, classes) => {
      render(<Button variant={variant}>{label}</Button>);
      const button = getButton(new RegExp(label, "i"));

      for (const className of classes) {
        expect(button).toHaveClass(className);
      }
    });
  });

  describe("sizes", () => {
    it.each([
      ["sm", "Small", ["px-3", "py-1.5", "text-sm"]],
      ["lg", "Large", ["px-6", "py-3", "text-lg"]],
      ["xl", "Extra Large", ["px-8", "py-4", "text-xl"]],
    ] as const)("applies %s size class", (size, label, classes) => {
      render(<Button size={size}>{label}</Button>);
      const button = getButton(new RegExp(label, "i"));

      for (const className of classes) {
        expect(button).toHaveClass(className);
      }
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
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
      const button = getButton(/next/i);
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

      await user.click(getButton(/click me/i));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("passes event to onClick handler", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Button onClick={onClick}>Click Me</Button>);

      await user.click(getButton(/click me/i));

      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({}));
    });
  });

  describe("accessibility", () => {
    it("can be focused with keyboard", async () => {
      const user = userEvent.setup();
      render(<Button>Focusable</Button>);

      await user.tab();

      expect(getButton(/focusable/i)).toHaveFocus();
    });

    it("applies custom className alongside default classes", () => {
      render(<Button className="my-custom-class">Custom</Button>);
      const button = getButton(/custom/i);
      expect(button).toHaveClass("my-custom-class");
      expect(button).toHaveClass("rounded-lg");
    });
  });

  describe("button type", () => {
    it("defaults to button type to prevent form submission", () => {
      render(<Button>Default Type</Button>);
      const button = getButton(/default type/i);
      expect(button).not.toHaveAttribute("type", "submit");
    });

    it("accepts type prop override", () => {
      render(<Button type="submit">Submit</Button>);
      const button = getButton(/submit/i);
      expect(button).toHaveAttribute("type", "submit");
    });
  });
});
