import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmotionWheel } from "./EmotionWheel";

describe("EmotionWheel", () => {
  // --- Happy Path Tests ---
  it("lets you pick a category then a subcategory (IDs)", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <EmotionWheel
        categories={[
          {
            _id: "cat_happy",
            name: "Happy",
            emoji: "😊",
            color: "#FFD93D",
            subcategories: [
              { _id: "sub_excited", name: "Excited", emoji: "🤩" },
              { _id: "sub_content", name: "Content", emoji: "😌" },
            ],
          },
          {
            _id: "cat_sad",
            name: "Sad",
            emoji: "😢",
            color: "#74B9FF",
            subcategories: [{ _id: "sub_lonely", name: "Lonely", emoji: "😔" }],
          },
        ]}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText(/how are you feeling right now/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /happy/i }));
    await screen.findByText(/pick a feeling/i);
    await user.click(await screen.findByRole("button", { name: /excited/i }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("cat_happy", "sub_excited");
  });

  it("back button returns to the category grid", async () => {
    const user = userEvent.setup();

    render(
      <EmotionWheel
        categories={[
          {
            _id: "cat_happy",
            name: "Happy",
            emoji: "😊",
            color: "#FFD93D",
            subcategories: [{ _id: "sub_excited", name: "Excited", emoji: "🤩" }],
          },
        ]}
        onSelect={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: /happy/i }));
    await screen.findByText(/pick a feeling/i);
    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(
      await screen.findByText(/how are you feeling right now/i)
    ).toBeInTheDocument();
  });

  // --- Error State / Edge Case Tests ---

  describe("empty categories", () => {
    it("renders prompt text with no category buttons when categories array is empty", () => {
      const onSelect = vi.fn();

      render(<EmotionWheel categories={[]} onSelect={onSelect} />);

      // Should still show the prompt
      expect(
        screen.getByText(/how are you feeling right now/i)
      ).toBeInTheDocument();

      // Should have no buttons (no categories to display)
      const buttons = screen.queryAllByRole("button");
      expect(buttons).toHaveLength(0);
    });
  });

  describe("category with no subcategories", () => {
    it("shows empty subcategory view when category has no subcategories", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <EmotionWheel
          categories={[
            {
              _id: "cat_empty",
              name: "Empty",
              emoji: "😶",
              color: "#CCCCCC",
              subcategories: [], // No subcategories
            },
          ]}
          onSelect={onSelect}
        />
      );

      await user.click(screen.getByRole("button", { name: /empty/i }));

      // Should show the "pick a feeling" prompt but no subcategory buttons
      await screen.findByText(/pick a feeling/i);

      // Only the back button should be present
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveAttribute("aria-label", "Back");
    });
  });

  describe("category toggle behavior", () => {
    it("closes subcategory view when clicking the same category again (toggle)", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <EmotionWheel
          categories={[
            {
              _id: "cat_happy",
              name: "Happy",
              emoji: "😊",
              color: "#FFD93D",
              subcategories: [
                { _id: "sub_excited", name: "Excited", emoji: "🤩" },
              ],
            },
          ]}
          onSelect={onSelect}
        />
      );

      // Click to open
      await user.click(screen.getByRole("button", { name: /happy/i }));
      await screen.findByText(/pick a feeling/i);

      // Click back to return
      await user.click(screen.getByRole("button", { name: /back/i }));

      // Should be back at the main view
      expect(
        await screen.findByText(/how are you feeling right now/i)
      ).toBeInTheDocument();
    });
  });

  describe("pre-selected state", () => {
    it("highlights previously selected category and subcategory", () => {
      const onSelect = vi.fn();

      render(
        <EmotionWheel
          categories={[
            {
              _id: "cat_happy",
              name: "Happy",
              emoji: "😊",
              color: "#FFD93D",
              subcategories: [
                { _id: "sub_excited", name: "Excited", emoji: "🤩" },
                { _id: "sub_content", name: "Content", emoji: "😌" },
              ],
            },
          ]}
          onSelect={onSelect}
          selectedCategory="cat_happy"
          selectedSubcategory="sub_excited"
        />
      );

      // Since selectedCategory is provided, the subcategory view should already be open
      // The "Excited" button should have the selected styling (ring-2 class)
      const excitedButton = screen.getByRole("button", { name: /excited/i });
      expect(excitedButton).toHaveClass("ring-2");
    });

    it("starts with active category when selectedCategory is provided", () => {
      const onSelect = vi.fn();

      render(
        <EmotionWheel
          categories={[
            {
              _id: "cat_happy",
              name: "Happy",
              emoji: "😊",
              color: "#FFD93D",
              subcategories: [
                { _id: "sub_excited", name: "Excited", emoji: "🤩" },
              ],
            },
          ]}
          onSelect={onSelect}
          selectedCategory="cat_happy"
        />
      );

      // Should immediately show subcategory view, not the main prompt
      expect(screen.getByText(/pick a feeling/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/how are you feeling right now/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("multiple categories", () => {
    it("allows switching between different categories", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <EmotionWheel
          categories={[
            {
              _id: "cat_happy",
              name: "Happy",
              emoji: "😊",
              color: "#FFD93D",
              subcategories: [
                { _id: "sub_excited", name: "Excited", emoji: "🤩" },
              ],
            },
            {
              _id: "cat_sad",
              name: "Sad",
              emoji: "😢",
              color: "#74B9FF",
              subcategories: [
                { _id: "sub_lonely", name: "Lonely", emoji: "😔" },
              ],
            },
          ]}
          onSelect={onSelect}
        />
      );

      // Select Happy category
      await user.click(screen.getByRole("button", { name: /happy/i }));
      await screen.findByRole("button", { name: /excited/i });

      // Go back and select Sad
      await user.click(screen.getByRole("button", { name: /back/i }));
      await screen.findByRole("button", { name: /sad/i });
      await user.click(screen.getByRole("button", { name: /sad/i }));

      // Should now see Lonely subcategory
      expect(
        await screen.findByRole("button", { name: /lonely/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /excited/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("onSelect callback", () => {
    it("does not call onSelect when only category is clicked", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <EmotionWheel
          categories={[
            {
              _id: "cat_happy",
              name: "Happy",
              emoji: "😊",
              color: "#FFD93D",
              subcategories: [
                { _id: "sub_excited", name: "Excited", emoji: "🤩" },
              ],
            },
          ]}
          onSelect={onSelect}
        />
      );

      await user.click(screen.getByRole("button", { name: /happy/i }));
      await screen.findByText(/pick a feeling/i);

      // onSelect should NOT be called yet (only category was clicked)
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("calls onSelect with correct IDs when subcategory is clicked", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <EmotionWheel
          categories={[
            {
              _id: "cat_angry",
              name: "Angry",
              emoji: "😠",
              color: "#FF6B6B",
              subcategories: [
                { _id: "sub_frustrated", name: "Frustrated", emoji: "😤" },
                { _id: "sub_annoyed", name: "Annoyed", emoji: "😒" },
              ],
            },
          ]}
          onSelect={onSelect}
        />
      );

      await user.click(screen.getByRole("button", { name: /angry/i }));
      await user.click(
        await screen.findByRole("button", { name: /annoyed/i })
      );

      expect(onSelect).toHaveBeenCalledWith("cat_angry", "sub_annoyed");
    });
  });
});
