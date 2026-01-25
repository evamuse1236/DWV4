import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input, Textarea } from "./Input";

describe("Input", () => {
  // --- Happy Path Tests ---
  it("renders with a label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders without a label", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("shows error message when error prop is provided", () => {
    render(<Input label="Email" error="Invalid email address" />);

    const input = screen.getByLabelText("Email");
    const errorMessage = screen.getByText("Invalid email address");

    expect(errorMessage).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows helper text when provided (and no error)", () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />);
    expect(screen.getByText("Must be at least 8 characters")).toBeInTheDocument();
  });

  it("hides helper text when error is shown", () => {
    render(
      <Input
        label="Password"
        helperText="Must be at least 8 characters"
        error="Password is required"
      />
    );

    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(screen.queryByText("Must be at least 8 characters")).not.toBeInTheDocument();
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(<Input label="Name" />);

    const input = screen.getByLabelText("Name");
    await user.type(input, "John Doe");

    expect(input).toHaveValue("John Doe");
  });

  it("calls onChange handler", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input label="Name" onChange={handleChange} />);

    await user.type(screen.getByLabelText("Name"), "a");

    expect(handleChange).toHaveBeenCalled();
  });

  it("can be disabled", () => {
    render(<Input label="Email" disabled />);

    const input = screen.getByLabelText("Email");
    expect(input).toBeDisabled();
  });

  it("renders left icon", () => {
    render(<Input label="Search" leftIcon={<span data-testid="left-icon">🔍</span>} />);
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
  });

  it("renders right icon", () => {
    render(<Input label="Password" rightIcon={<span data-testid="right-icon">👁</span>} />);
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("uses provided id for label association", () => {
    render(<Input id="custom-id" label="Custom" />);

    const input = screen.getByLabelText("Custom");
    expect(input).toHaveAttribute("id", "custom-id");
  });

  it("applies custom className", () => {
    render(<Input label="Test" className="custom-class" />);

    const input = screen.getByLabelText("Test");
    expect(input).toHaveClass("custom-class");
  });

  // --- Error State / Edge Case Tests ---

  describe("error styling", () => {
    it("applies error border styling when error is present", () => {
      render(<Input label="Email" error="Invalid email" />);

      const input = screen.getByLabelText("Email");
      // Error state should add red border styling
      expect(input).toHaveClass("border-red-500");
    });

    it("shows error text in red color", () => {
      render(<Input label="Email" error="Invalid email address" />);

      const errorMessage = screen.getByText("Invalid email address");
      expect(errorMessage).toHaveClass("text-red-600");
    });

    it("does not show error message when error is empty string", () => {
      render(<Input label="Email" error="" />);

      // The input should not have aria-invalid when error is empty
      const input = screen.getByLabelText("Email");
      expect(input).not.toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("required field behavior", () => {
    it("marks input as required when required prop is passed", () => {
      render(<Input label="Username" required />);

      const input = screen.getByLabelText("Username");
      expect(input).toBeRequired();
    });

    it("allows empty value on non-required input", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input label="Optional Field" onChange={handleChange} />);

      const input = screen.getByLabelText("Optional Field");
      await user.type(input, "a");
      await user.clear(input);

      expect(input).toHaveValue("");
    });
  });

  describe("special input types", () => {
    it("renders password type input", () => {
      render(<Input label="Password" type="password" />);

      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");
    });

    it("renders email type input", () => {
      render(<Input label="Email" type="email" />);

      const input = screen.getByLabelText("Email");
      expect(input).toHaveAttribute("type", "email");
    });

    it("renders number type input", () => {
      render(<Input label="Age" type="number" />);

      const input = screen.getByLabelText("Age");
      expect(input).toHaveAttribute("type", "number");
    });
  });

  describe("focus behavior", () => {
    it("can be focused programmatically", async () => {
      render(<Input label="Focusable" data-testid="focus-input" />);

      const input = screen.getByLabelText("Focusable");
      input.focus();

      expect(input).toHaveFocus();
    });

    it("responds to tab navigation", async () => {
      const user = userEvent.setup();

      render(
        <>
          <Input label="First" />
          <Input label="Second" />
        </>
      );

      await user.tab();
      expect(screen.getByLabelText("First")).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText("Second")).toHaveFocus();
    });
  });

  describe("readOnly state", () => {
    it("prevents editing when readOnly is true", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Input
          label="Read Only"
          value="Fixed Value"
          readOnly
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText("Read Only");
      await user.type(input, "new text");

      // onChange should not be called for readonly input
      expect(handleChange).not.toHaveBeenCalled();
      expect(input).toHaveValue("Fixed Value");
    });
  });

  describe("max length", () => {
    it("respects maxLength attribute", async () => {
      const user = userEvent.setup();

      render(<Input label="Limited" maxLength={5} />);

      const input = screen.getByLabelText("Limited");
      await user.type(input, "abcdefgh"); // Try to type more than maxLength

      expect(input).toHaveValue("abcde"); // Only first 5 characters
    });
  });
});

describe("Textarea", () => {
  // --- Happy Path Tests ---
  it("renders with a label", () => {
    render(<Textarea label="Description" />);
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("shows error message when error prop is provided", () => {
    render(<Textarea label="Bio" error="Bio is required" />);

    const textarea = screen.getByLabelText("Bio");
    const errorMessage = screen.getByText("Bio is required");

    expect(errorMessage).toBeInTheDocument();
    expect(textarea).toHaveAttribute("aria-invalid", "true");
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(<Textarea label="Notes" />);

    const textarea = screen.getByLabelText("Notes");
    await user.type(textarea, "Some notes here");

    expect(textarea).toHaveValue("Some notes here");
  });

  it("shows helper text when provided", () => {
    render(<Textarea label="Description" helperText="Max 500 characters" />);
    expect(screen.getByText("Max 500 characters")).toBeInTheDocument();
  });

  it("can be disabled", () => {
    render(<Textarea label="Feedback" disabled />);

    const textarea = screen.getByLabelText("Feedback");
    expect(textarea).toBeDisabled();
  });

  // --- Error State / Edge Case Tests ---

  describe("error styling", () => {
    it("applies error border styling when error is present", () => {
      render(<Textarea label="Description" error="Description required" />);

      const textarea = screen.getByLabelText("Description");
      expect(textarea).toHaveClass("border-red-500");
    });

    it("prioritizes error over helper text", () => {
      render(
        <Textarea
          label="Notes"
          helperText="Enter your notes here"
          error="This field has an error"
        />
      );

      expect(screen.getByText("This field has an error")).toBeInTheDocument();
      expect(
        screen.queryByText("Enter your notes here")
      ).not.toBeInTheDocument();
    });
  });

  describe("large text handling", () => {
    it("accepts very long text input", () => {
      // Use fireEvent.change instead of user.type for bulk text
      // user.type simulates 1000 keypresses which is too slow
      const longText = "a".repeat(1000);

      render(<Textarea label="Long Content" />);

      const textarea = screen.getByLabelText("Long Content");
      fireEvent.change(textarea, { target: { value: longText } });

      expect(textarea).toHaveValue(longText);
    });

    it("handles multiline text with newlines", () => {
      // Use fireEvent.change with literal newlines instead of {Enter}
      // {Enter} can cause race conditions in concurrent test environments
      const multilineText = "Line 1\nLine 2\nLine 3";

      render(<Textarea label="Multiline" />);

      const textarea = screen.getByLabelText("Multiline") as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: multilineText } });

      // Check the value contains the expected lines
      expect(textarea.value).toContain("Line 1");
      expect(textarea.value).toContain("Line 2");
      expect(textarea.value).toContain("Line 3");
      expect(textarea.value).toBe(multilineText);
    });
  });

  describe("rows configuration", () => {
    it("accepts rows prop for height control", () => {
      render(<Textarea label="Sized" rows={10} />);

      const textarea = screen.getByLabelText("Sized");
      expect(textarea).toHaveAttribute("rows", "10");
    });
  });

  describe("resize behavior", () => {
    it("applies custom className for resize control", () => {
      render(<Textarea label="No Resize" className="resize-none" />);

      const textarea = screen.getByLabelText("No Resize");
      expect(textarea).toHaveClass("resize-none");
    });
  });
});
