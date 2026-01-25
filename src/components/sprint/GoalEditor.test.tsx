import { render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GoalEditor } from "./GoalEditor";

describe("GoalEditor", () => {
  // --- Happy Path Tests ---
  it("walks through SMART steps and calls onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<GoalEditor onSave={onSave} onCancel={onCancel} />);

    const getNextButton = () => screen.getByRole("button", { name: /next/i });

    await user.type(
      screen.getByPlaceholderText(/learn multiplication tables/i),
      "Read 20 pages"
    );
    await waitFor(() => expect(getNextButton()).toBeEnabled());
    await user.click(getNextButton());
    await screen.findByText(/what exactly will you do/i);

    await user.type(
      screen.getByPlaceholderText(/practice multiplication tables/i),
      "Read 20 pages of my book every day"
    );
    await waitFor(() => expect(getNextButton()).toBeEnabled());
    await user.click(getNextButton());
    await screen.findByText(/how will you know you did it/i);

    await user.type(
      screen.getByPlaceholderText(/answer 50 multiplication problems/i),
      "I will have read 280 pages by the end of the sprint"
    );
    await waitFor(() => expect(getNextButton()).toBeEnabled());
    await user.click(getNextButton());
    await screen.findByText(/can you really do this in 2 weeks/i);

    await user.type(
      screen.getByPlaceholderText(/yes, if i practice/i),
      "Yes, I can do 20 pages in 30 minutes"
    );
    await waitFor(() => expect(getNextButton()).toBeEnabled());
    await user.click(getNextButton());
    await screen.findByText(/why does this matter to you/i);

    await user.type(
      screen.getByPlaceholderText(/it will help me solve/i),
      "Because I love stories and want to read faster"
    );
    await waitFor(() => expect(getNextButton()).toBeEnabled());
    await user.click(getNextButton());
    await screen.findByText(/when will you finish/i);

    await user.type(
      screen.getByPlaceholderText(/by the end of this 2-week sprint/i),
      "By the end of this sprint"
    );

    await user.click(screen.getByRole("button", { name: /save goal/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      title: "Read 20 pages",
      specific: "Read 20 pages of my book every day",
      measurable: "I will have read 280 pages by the end of the sprint",
      achievable: "Yes, I can do 20 pages in 30 minutes",
      relevant: "Because I love stories and want to read faster",
      timeBound: "By the end of this sprint",
    });
    expect(onCancel).not.toHaveBeenCalled();
  });

  // --- Error State / Edge Case Tests ---

  describe("empty submission prevention", () => {
    it("disables Next button when input is empty", () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<GoalEditor onSave={onSave} onCancel={onCancel} />);

      // The Next button should be disabled initially (empty input)
      const nextButton = screen.getByRole("button", { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it("disables Next button when input contains only whitespace", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<GoalEditor onSave={onSave} onCancel={onCancel} />);

      // Type only spaces
      await user.type(
        screen.getByPlaceholderText(/learn multiplication tables/i),
        "   "
      );

      // The Next button should still be disabled (wait for state update)
      const nextButton = screen.getByRole("button", { name: /next/i });
      await waitFor(() => expect(nextButton).toBeDisabled());
    });

    it("enables Next button only after valid input is entered", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<GoalEditor onSave={onSave} onCancel={onCancel} />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      expect(nextButton).toBeDisabled();

      // Type valid input
      await user.type(
        screen.getByPlaceholderText(/learn multiplication tables/i),
        "A"
      );

      await waitFor(() => expect(nextButton).toBeEnabled());
    });
  });

  describe("cancel button behavior", () => {
    it("calls onCancel when Cancel button is clicked on first step", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<GoalEditor onSave={onSave} onCancel={onCancel} />);

      // On first step, the button should say "Cancel"
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Wait for any animations to settle, then check call count
      await waitFor(() => {
        expect(onCancel).toHaveBeenCalled();
      });
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onSave).not.toHaveBeenCalled();
    });

    it("goes back to previous step when Back button is clicked (not cancel)", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<GoalEditor onSave={onSave} onCancel={onCancel} />);

      // Go to step 2
      await user.type(
        screen.getByPlaceholderText(/learn multiplication tables/i),
        "My Goal"
      );
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /next/i })).toBeEnabled()
      );
      await user.click(screen.getByRole("button", { name: /next/i }));
      await screen.findByText(/what exactly will you do/i);

      // On step 2, the secondary button should say "Back"
      const backButton = screen.getByRole("button", { name: /back/i });
      expect(backButton).toBeInTheDocument();

      await user.click(backButton);

      // Should be back on step 1 (showing "What's your goal?" question)
      await waitFor(() => {
        expect(
          screen.getByText(/what's your goal/i)
        ).toBeInTheDocument();
      });
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("disables all buttons when isLoading is true", () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<GoalEditor onSave={onSave} onCancel={onCancel} isLoading />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      const nextButton = screen.getByRole("button", { name: /next/i });

      expect(cancelButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it("shows loading spinner on Save button when isLoading on last step", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      // Start with initial data to jump to the last step quickly
      const initialData = {
        title: "Test Goal",
        specific: "Specific description",
        measurable: "How to measure",
        achievable: "Is achievable",
        relevant: "Why relevant",
        timeBound: "By end of sprint",
      };

      const { rerender } = render(
        <GoalEditor
          onSave={onSave}
          onCancel={onCancel}
          initialData={initialData}
        />
      );

      // Navigate to the last step
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByRole("button", { name: /next/i }));
      }

      // Verify we're on the last step
      await screen.findByRole("button", { name: /save goal/i });

      // Rerender with isLoading
      rerender(
        <GoalEditor
          onSave={onSave}
          onCancel={onCancel}
          initialData={initialData}
          isLoading
        />
      );

      // Check for spinner (the component uses animate-spin class)
      const saveButton = screen.getByRole("button", { name: /save goal/i });
      expect(saveButton.querySelector("svg.animate-spin")).toBeTruthy();
      expect(saveButton).toBeDisabled();
    });
  });

  describe("navigation edge cases", () => {
    it("preserves data when navigating back and forth", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<GoalEditor onSave={onSave} onCancel={onCancel} />);

      // Enter title and go to step 2
      const titleInput = screen.getByPlaceholderText(
        /learn multiplication tables/i
      );
      await user.clear(titleInput);
      await user.type(titleInput, "My Important Goal");

      // Wait for Next button to be enabled, then click
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /next/i })).toBeEnabled()
      );
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Enter specific and go back
      await screen.findByText(/what exactly will you do/i);
      const specificInput = screen.getByPlaceholderText(/practice multiplication tables/i);
      await user.clear(specificInput);
      await user.type(specificInput, "Do something specific");
      await user.click(screen.getByRole("button", { name: /back/i }));

      // Verify title is preserved
      await screen.findByText(/what's your goal/i);
      const preservedInput = screen.getByPlaceholderText(
        /learn multiplication tables/i
      );
      expect(preservedInput).toHaveValue("My Important Goal");
    });

    it("uses initialData when provided", () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      const initialData = {
        title: "Pre-filled Title",
        specific: "",
        measurable: "",
        achievable: "",
        relevant: "",
        timeBound: "",
      };

      render(
        <GoalEditor
          onSave={onSave}
          onCancel={onCancel}
          initialData={initialData}
        />
      );

      const titleInput = screen.getByPlaceholderText(
        /learn multiplication tables/i
      );
      expect(titleInput).toHaveValue("Pre-filled Title");

      // Next button should be enabled because we have initial data
      expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
    });
  });

  describe("step indicator", () => {
    it("shows correct step number", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<GoalEditor onSave={onSave} onCancel={onCancel} />);

      // First step
      expect(screen.getByText(/1 of 6/)).toBeInTheDocument();

      // Go to step 2
      await user.type(
        screen.getByPlaceholderText(/learn multiplication tables/i),
        "Test"
      );
      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() =>
        expect(screen.getByText(/2 of 6/)).toBeInTheDocument()
      );
    });
  });
});
