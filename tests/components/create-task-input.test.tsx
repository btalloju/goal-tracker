import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateTaskInput } from "@/components/taskboard/create-task-input";

// Mock the server action
vi.mock("@/app/actions/tasks", () => ({
  createTask: vi.fn().mockResolvedValue({ success: true, task: { id: "t-1" } }),
}));

describe("CreateTaskInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders input and submit button", () => {
    render(<CreateTaskInput />);

    expect(screen.getByPlaceholderText(/add a quick task/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("submit button is disabled when input is empty", () => {
    render(<CreateTaskInput />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("enables submit button when text is entered", async () => {
    const user = userEvent.setup();
    render(<CreateTaskInput />);

    await user.type(screen.getByPlaceholderText(/add a quick task/i), "Buy groceries");

    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("calls createTask on form submit", async () => {
    const user = userEvent.setup();
    const { createTask } = await import("@/app/actions/tasks");
    render(<CreateTaskInput />);

    await user.type(screen.getByPlaceholderText(/add a quick task/i), "Buy groceries");
    await user.click(screen.getByRole("button"));

    expect(createTask).toHaveBeenCalledWith({ title: "Buy groceries" });
  });

  it("shows error message on failure", async () => {
    const { createTask } = await import("@/app/actions/tasks");
    (createTask as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: false,
      error: "Daily limit reached",
    });

    const user = userEvent.setup();
    render(<CreateTaskInput />);

    await user.type(screen.getByPlaceholderText(/add a quick task/i), "Task");
    await user.click(screen.getByRole("button"));

    expect(await screen.findByText("Daily limit reached")).toBeInTheDocument();
  });
});
