import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AISuggestButton } from "@/components/ai/ai-suggest-button";

describe("AISuggestButton", () => {
  it("renders with default text", () => {
    render(<AISuggestButton onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: /ai suggest/i })).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<AISuggestButton onClick={vi.fn()} loading />);

    expect(screen.getByRole("button", { name: /generating/i })).toBeDisabled();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<AISuggestButton onClick={onClick} />);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    render(<AISuggestButton onClick={vi.fn()} disabled />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when loading", () => {
    render(<AISuggestButton onClick={vi.fn()} loading />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
