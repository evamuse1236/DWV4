import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmotionWheel } from "./EmotionWheel";

describe("EmotionWheel", () => {
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
});
