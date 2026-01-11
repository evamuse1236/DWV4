import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
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
});

