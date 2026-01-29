import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoalCard } from "@/components/dashboard/goal-card";

// Mock next/link
import { vi } from "vitest";
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const baseGoal = {
  id: "goal-1",
  title: "Learn Rust",
  description: "Master systems programming",
  status: "IN_PROGRESS" as const,
  priority: "HIGH" as const,
  targetDate: new Date("2025-12-31"),
  milestones: [
    { id: "ms-1", title: "Basics", status: "COMPLETED" as const, dueDate: null, completedAt: new Date(), notes: null, goalId: "goal-1", createdAt: new Date(), updatedAt: new Date() },
    { id: "ms-2", title: "Advanced", status: "PENDING" as const, dueDate: null, completedAt: null, notes: null, goalId: "goal-1", createdAt: new Date(), updatedAt: new Date() },
  ],
};

describe("GoalCard", () => {
  it("renders goal title", () => {
    render(<GoalCard goal={baseGoal} />);

    expect(screen.getByText("Learn Rust")).toBeInTheDocument();
  });

  it("renders goal description", () => {
    render(<GoalCard goal={baseGoal} />);

    expect(screen.getByText("Master systems programming")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<GoalCard goal={baseGoal} />);

    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders milestone progress", () => {
    render(<GoalCard goal={baseGoal} />);

    expect(screen.getByText("1/2 milestones")).toBeInTheDocument();
  });

  it("links to goal detail page", () => {
    render(<GoalCard goal={baseGoal} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard/goals/goal-1");
  });

  it("handles goal with no milestones", () => {
    render(<GoalCard goal={{ ...baseGoal, milestones: [] }} />);

    expect(screen.queryByText(/milestones/)).not.toBeInTheDocument();
  });

  it("handles goal with no description", () => {
    render(<GoalCard goal={{ ...baseGoal, description: null }} />);

    expect(screen.queryByText("Master systems programming")).not.toBeInTheDocument();
  });
});
