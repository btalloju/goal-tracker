import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mock functions
const { mockAuthFn, mockPrisma } = vi.hoisted(() => {
  const createModelMock = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    upsert: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({ _max: { position: 0 } }),
  });
  return {
    mockAuthFn: vi.fn(),
    mockPrisma: {
      user: createModelMock(),
      userProfile: createModelMock(),
      category: createModelMock(),
      goal: createModelMock(),
      milestone: createModelMock(),
      task: createModelMock(),
      $transaction: vi.fn(async (args: unknown) => {
        if (typeof args === "function") return (args as Function)(mockPrisma);
        return Promise.all(args as Promise<unknown>[]);
      }),
    },
  };
});

vi.mock("@/lib/auth", () => ({
  auth: mockAuthFn,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: mockPrisma,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Import code under test
import {
  getTodayTasks,
  createTask,
  toggleTaskComplete,
  updateTask,
  deleteTask,
  reorderTasks,
} from "@/app/actions/tasks";

const DEFAULT_SESSION = {
  user: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

describe("task actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthFn.mockResolvedValue(DEFAULT_SESSION);
    mockPrisma.$transaction.mockImplementation(async (args: unknown) => {
      if (typeof args === "function") return (args as Function)(mockPrisma);
      return Promise.all(args as Promise<unknown>[]);
    });
  });

  describe("getTodayTasks", () => {
    it("returns empty array when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      const result = await getTodayTasks();

      expect(result).toEqual([]);
    });

    it("returns tasks and auto-creates tasks for milestones without tasks", async () => {
      mockPrisma.task.findMany.mockResolvedValue([
        { id: "task-1", title: "Quick task", milestoneId: null },
      ]);
      mockPrisma.milestone.findMany.mockResolvedValue([
        {
          id: "ms-1",
          title: "Milestone due today",
          notes: null,
          dueDate: new Date(),
          goal: { id: "g-1", title: "Goal", category: { name: "Cat", color: "#000" } },
        },
      ]);
      mockPrisma.task.create.mockResolvedValue({
        id: "task-2",
        title: "Milestone due today",
        milestoneId: "ms-1",
      });

      const result = await getTodayTasks();

      expect(result).toHaveLength(2);
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          title: "Milestone due today",
          notes: null,
          dueDate: expect.any(Date),
          milestoneId: "ms-1",
          userId: "user-1",
          position: 0,
        },
        include: expect.any(Object),
      });
    });
  });

  describe("createTask", () => {
    it("creates an orphaned task", async () => {
      mockPrisma.task.count.mockResolvedValue(0);
      mockPrisma.task.aggregate.mockResolvedValue({ _max: { position: 5 } });
      const task = { id: "task-1", title: "Buy groceries", milestoneId: null };
      mockPrisma.task.create.mockResolvedValue(task);

      const result = await createTask({ title: "Buy groceries" });

      expect(result.success).toBe(true);
      expect(result.task).toEqual(task);
    });

    it("enforces daily task limit", async () => {
      mockPrisma.task.count.mockResolvedValue(20);

      const result = await createTask({ title: "One more" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("20 quick tasks per day");
    });

    it("returns error when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      const result = await createTask({ title: "Test" });

      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });
  });

  describe("toggleTaskComplete", () => {
    it("marks incomplete task as complete", async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: "task-1",
        userId: "user-1",
        completed: false,
        milestoneId: null,
      });
      mockPrisma.task.update.mockResolvedValue({});

      const result = await toggleTaskComplete("task-1");

      expect(result.success).toBe(true);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: {
          completed: true,
          completedAt: expect.any(Date),
        },
      });
    });

    it("syncs completion to linked milestone", async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: "task-1",
        userId: "user-1",
        completed: false,
        milestoneId: "ms-1",
        milestone: { id: "ms-1" },
      });
      mockPrisma.task.update.mockResolvedValue({});
      mockPrisma.milestone.update.mockResolvedValue({});

      await toggleTaskComplete("task-1");

      expect(mockPrisma.milestone.update).toHaveBeenCalledWith({
        where: { id: "ms-1" },
        data: {
          status: "COMPLETED",
          completedAt: expect.any(Date),
        },
      });
    });

    it("uncompletes task and resets milestone", async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: "task-1",
        userId: "user-1",
        completed: true,
        milestoneId: "ms-1",
        milestone: { id: "ms-1" },
      });
      mockPrisma.task.update.mockResolvedValue({});
      mockPrisma.milestone.update.mockResolvedValue({});

      await toggleTaskComplete("task-1");

      expect(mockPrisma.milestone.update).toHaveBeenCalledWith({
        where: { id: "ms-1" },
        data: {
          status: "PENDING",
          completedAt: null,
        },
      });
    });

    it("returns error when task not found", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const result = await toggleTaskComplete("task-999");

      expect(result).toEqual({ success: false, error: "Task not found" });
    });

    it("returns error when task owned by another user", async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: "task-1",
        userId: "other-user",
      });

      const result = await toggleTaskComplete("task-1");

      expect(result).toEqual({ success: false, error: "Task not found" });
    });
  });

  describe("updateTask", () => {
    it("updates task title and notes", async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: "task-1",
        userId: "user-1",
        title: "Old",
        notes: "Old notes",
      });
      mockPrisma.task.update.mockResolvedValue({});

      const result = await updateTask("task-1", { title: "New", notes: "New notes" });

      expect(result.success).toBe(true);
    });

    it("returns error when task not found", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const result = await updateTask("task-999", { title: "Test" });

      expect(result).toEqual({ success: false, error: "Task not found" });
    });
  });

  describe("deleteTask", () => {
    it("deletes orphaned task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: "task-1",
        userId: "user-1",
        milestoneId: null,
      });
      mockPrisma.task.delete.mockResolvedValue({});

      const result = await deleteTask("task-1");

      expect(result.success).toBe(true);
    });

    it("rejects deletion of milestone-linked tasks", async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: "task-1",
        userId: "user-1",
        milestoneId: "ms-1",
      });

      const result = await deleteTask("task-1");

      expect(result.success).toBe(false);
      expect(result.error).toContain("milestone-linked");
    });

    it("returns error when task not found", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const result = await deleteTask("task-999");

      expect(result).toEqual({ success: false, error: "Task not found" });
    });
  });

  describe("reorderTasks", () => {
    it("updates positions in a transaction", async () => {
      mockPrisma.task.update.mockResolvedValue({});

      const result = await reorderTasks(["task-2", "task-1", "task-3"]);

      expect(result.success).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("returns error when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      const result = await reorderTasks(["task-1"]);

      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });
  });
});
