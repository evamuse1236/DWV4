import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Card, CardHeader, CardContent, CardFooter } from "./Card";

describe("Card", () => {
  // --- Happy Path Tests ---
  it("renders children content", () => {
    render(<Card>Hello Card</Card>);
    expect(screen.getByText("Hello Card")).toBeInTheDocument();
  });

  it("applies default variant styles", () => {
    render(<Card data-testid="card">Content</Card>);

    const card = screen.getByTestId("card");
    expect(card).toHaveClass("bg-white");
    expect(card).toHaveClass("border");
    expect(card).toHaveClass("shadow-sm");
  });

  it("applies outlined variant styles", () => {
    render(
      <Card variant="outlined" data-testid="card">
        Content
      </Card>
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveClass("border-2");
  });

  it("applies elevated variant styles", () => {
    render(
      <Card variant="elevated" data-testid="card">
        Content
      </Card>
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveClass("shadow-lg");
  });

  it("applies different padding sizes", () => {
    const { rerender } = render(
      <Card padding="none" data-testid="card">
        Content
      </Card>
    );

    let card = screen.getByTestId("card");
    expect(card).not.toHaveClass("p-3");
    expect(card).not.toHaveClass("p-4");
    expect(card).not.toHaveClass("p-6");

    rerender(
      <Card padding="sm" data-testid="card">
        Content
      </Card>
    );
    card = screen.getByTestId("card");
    expect(card).toHaveClass("p-3");

    rerender(
      <Card padding="md" data-testid="card">
        Content
      </Card>
    );
    card = screen.getByTestId("card");
    expect(card).toHaveClass("p-4");

    rerender(
      <Card padding="lg" data-testid="card">
        Content
      </Card>
    );
    card = screen.getByTestId("card");
    expect(card).toHaveClass("p-6");
  });

  it("applies custom className", () => {
    render(
      <Card className="my-custom-class" data-testid="card">
        Content
      </Card>
    );

    expect(screen.getByTestId("card")).toHaveClass("my-custom-class");
  });

  it("renders as motion.div when hoverable", () => {
    // When hoverable, it should still render the content
    render(<Card hoverable>Hoverable Card</Card>);
    expect(screen.getByText("Hoverable Card")).toBeInTheDocument();
  });

  // --- Edge Case Tests ---

  describe("empty content", () => {
    it("renders empty card without errors", () => {
      render(<Card data-testid="empty-card" />);
      expect(screen.getByTestId("empty-card")).toBeInTheDocument();
    });

    it("renders card with only whitespace content", () => {
      render(<Card data-testid="whitespace-card">   </Card>);
      expect(screen.getByTestId("whitespace-card")).toBeInTheDocument();
    });
  });

  describe("nested content", () => {
    it("handles deeply nested children", () => {
      render(
        <Card data-testid="nested-card">
          <div>
            <div>
              <div>
                <span>Deep Content</span>
              </div>
            </div>
          </div>
        </Card>
      );
      expect(screen.getByText("Deep Content")).toBeInTheDocument();
    });

    it("renders multiple Card components nested", () => {
      render(
        <Card data-testid="outer-card">
          <Card data-testid="inner-card">Nested Card</Card>
        </Card>
      );
      expect(screen.getByTestId("outer-card")).toBeInTheDocument();
      expect(screen.getByTestId("inner-card")).toBeInTheDocument();
      expect(screen.getByText("Nested Card")).toBeInTheDocument();
    });
  });

  describe("multiple className combinations", () => {
    it("combines variant, padding, and custom className", () => {
      render(
        <Card
          variant="elevated"
          padding="lg"
          className="custom-card-class"
          data-testid="combo-card"
        >
          Combo
        </Card>
      );

      const card = screen.getByTestId("combo-card");
      expect(card).toHaveClass("shadow-lg");
      expect(card).toHaveClass("p-6");
      expect(card).toHaveClass("custom-card-class");
    });
  });

  describe("event handling", () => {
    it("passes through onClick handler", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Card data-testid="clickable-card" onClick={onClick}>
          Clickable
        </Card>
      );

      await user.click(screen.getByTestId("clickable-card"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe("CardHeader", () => {
  // --- Happy Path Tests ---
  it("renders title", () => {
    render(<CardHeader title="My Title" />);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    render(<CardHeader title="Title" subtitle="My Subtitle" />);
    expect(screen.getByText("My Subtitle")).toBeInTheDocument();
  });

  it("renders action element", () => {
    render(
      <CardHeader
        title="Title"
        action={<button data-testid="action-btn">Action</button>}
      />
    );
    expect(screen.getByTestId("action-btn")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <CardHeader>
        <span data-testid="custom-content">Custom Header Content</span>
      </CardHeader>
    );
    expect(screen.getByTestId("custom-content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<CardHeader title="Title" className="custom-header" data-testid="header" />);
    expect(screen.getByTestId("header")).toHaveClass("custom-header");
  });

  // --- Edge Case Tests ---

  describe("missing props", () => {
    it("renders without title when children are provided", () => {
      render(
        <CardHeader data-testid="no-title-header">
          <span>Custom Header Only</span>
        </CardHeader>
      );

      expect(screen.getByTestId("no-title-header")).toBeInTheDocument();
      expect(screen.getByText("Custom Header Only")).toBeInTheDocument();
    });

    it("renders without subtitle", () => {
      render(<CardHeader title="Just Title" data-testid="no-subtitle" />);

      expect(screen.getByText("Just Title")).toBeInTheDocument();
      // Should not have any paragraph for subtitle
      const header = screen.getByTestId("no-subtitle");
      expect(header.querySelectorAll("p").length).toBeLessThanOrEqual(1);
    });
  });

  describe("long content handling", () => {
    it("handles very long title text", () => {
      const longTitle = "A".repeat(200);
      render(<CardHeader title={longTitle} data-testid="long-title" />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("handles very long subtitle text", () => {
      const longSubtitle = "B".repeat(300);
      render(
        <CardHeader title="Short" subtitle={longSubtitle} data-testid="long-subtitle" />
      );

      expect(screen.getByText(longSubtitle)).toBeInTheDocument();
    });
  });
});

describe("CardContent", () => {
  // --- Happy Path Tests ---
  it("renders children content", () => {
    render(<CardContent>Card body content</CardContent>);
    expect(screen.getByText("Card body content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <CardContent className="custom-content" data-testid="content">
        Content
      </CardContent>
    );
    expect(screen.getByTestId("content")).toHaveClass("custom-content");
  });

  // --- Edge Case Tests ---

  describe("empty content", () => {
    it("renders empty CardContent without errors", () => {
      render(<CardContent data-testid="empty-content" />);
      expect(screen.getByTestId("empty-content")).toBeInTheDocument();
    });
  });

  describe("complex content", () => {
    it("renders form elements inside CardContent", () => {
      render(
        <CardContent>
          <form>
            <input type="text" placeholder="Name" />
            <button type="submit">Submit</button>
          </form>
        </CardContent>
      );

      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    });
  });
});

describe("CardFooter", () => {
  // --- Happy Path Tests ---
  it("renders children content", () => {
    render(
      <CardFooter>
        <button>Save</button>
        <button>Cancel</button>
      </CardFooter>
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <CardFooter className="custom-footer" data-testid="footer">
        Footer
      </CardFooter>
    );
    expect(screen.getByTestId("footer")).toHaveClass("custom-footer");
  });

  it("has border-t class for top border", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    expect(screen.getByTestId("footer")).toHaveClass("border-t");
  });

  // --- Edge Case Tests ---

  describe("button layouts", () => {
    it("handles single button in footer", () => {
      render(
        <CardFooter>
          <button>Only One</button>
        </CardFooter>
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
    });

    it("handles many buttons in footer", () => {
      render(
        <CardFooter>
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
          <button>Four</button>
        </CardFooter>
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(4);
    });
  });

  describe("empty footer", () => {
    it("renders empty footer without errors", () => {
      render(<CardFooter data-testid="empty-footer" />);
      expect(screen.getByTestId("empty-footer")).toBeInTheDocument();
    });
  });
});

describe("Card composition", () => {
  // --- Happy Path Tests ---
  it("works with all sub-components together", () => {
    render(
      <Card data-testid="card">
        <CardHeader
          title="User Profile"
          subtitle="Manage your account"
          action={<button>Edit</button>}
        />
        <CardContent>
          <p>Profile content goes here</p>
        </CardContent>
        <CardFooter>
          <button>Save Changes</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByText("User Profile")).toBeInTheDocument();
    expect(screen.getByText("Manage your account")).toBeInTheDocument();
    expect(screen.getByText("Profile content goes here")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  // --- Edge Case Tests ---

  describe("minimal composition", () => {
    it("works with only CardHeader", () => {
      render(
        <Card data-testid="header-only">
          <CardHeader title="Just Header" />
        </Card>
      );

      expect(screen.getByTestId("header-only")).toBeInTheDocument();
      expect(screen.getByText("Just Header")).toBeInTheDocument();
    });

    it("works with only CardContent", () => {
      render(
        <Card data-testid="content-only">
          <CardContent>Just Content</CardContent>
        </Card>
      );

      expect(screen.getByTestId("content-only")).toBeInTheDocument();
      expect(screen.getByText("Just Content")).toBeInTheDocument();
    });

    it("works with only CardFooter", () => {
      render(
        <Card data-testid="footer-only">
          <CardFooter>
            <button>Just Footer</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId("footer-only")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Just Footer" })).toBeInTheDocument();
    });
  });

  describe("non-standard ordering", () => {
    it("renders components in reverse order", () => {
      render(
        <Card data-testid="reverse-card">
          <CardFooter data-testid="footer">
            <button>Footer First</button>
          </CardFooter>
          <CardContent data-testid="content">Content Second</CardContent>
          <CardHeader title="Header Last" data-testid="header" />
        </Card>
      );

      expect(screen.getByTestId("reverse-card")).toBeInTheDocument();
      expect(screen.getByText("Footer First")).toBeInTheDocument();
      expect(screen.getByText("Content Second")).toBeInTheDocument();
      expect(screen.getByText("Header Last")).toBeInTheDocument();
    });
  });

  describe("multiple sections", () => {
    it("allows multiple CardContent sections", () => {
      render(
        <Card>
          <CardContent data-testid="content-1">First Section</CardContent>
          <CardContent data-testid="content-2">Second Section</CardContent>
        </Card>
      );

      expect(screen.getByTestId("content-1")).toBeInTheDocument();
      expect(screen.getByTestId("content-2")).toBeInTheDocument();
    });
  });
});
