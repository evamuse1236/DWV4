import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input, Textarea } from "./Input";

describe("Input", () => {
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
});

describe("Textarea", () => {
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
});
