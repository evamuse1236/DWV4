import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardHeader, CardContent, CardFooter } from "./Card";

describe("Card", () => {
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
});

describe("CardHeader", () => {
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
});

describe("CardContent", () => {
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
});

describe("CardFooter", () => {
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
});

describe("Card composition", () => {
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
});
