import { render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GoalEditor } from "./GoalEditor";

describe("GoalEditor", () => {
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
});
