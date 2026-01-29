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

// Mock the AI import used by goals.ts
vi.mock("@/app/actions/ai", () => ({
  updateProfileFromCompletion: vi.fn().mockResolvedValue({ success: true }),
}));

// Import code under test
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  getDashboardStats,
} from "@/app/actions/goals";

const DEFAULT_SESSION = {
  user: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

describe("goal actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthFn.mockResolvedValue(DEFAULT_SESSION);
    mockPrisma.$transaction.mockImplementation(async (args: unknown) => {
      if (typeof args === "function") return (args as Function)(mockPrisma);
      return Promise.all(args as Promise<unknown>[]);
    });
  });

  describe("getGoals", () => {
    it("returns all goals for the user", async () => {
      const goals = [{ id: "goal-1", title: "Learn Rust" }];
      mockPrisma.goal.findMany.mockResolvedValue(goals);

      const result = await getGoals();

      expect(result).toEqual(goals);
      expect(mockPrisma.goal.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: { category: true, milestones: true },
        orderBy: { createdAt: "desc" },
      });
    });

    it("filters by categoryId when provided", async () => {
      mockPrisma.goal.findMany.mockResolvedValue([]);

      await getGoals("cat-1");

      expect(mockPrisma.goal.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1", categoryId: "cat-1" },
        include: { category: true, milestones: true },
        orderBy: { createdAt: "desc" },
      });
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(getGoals()).rejects.toThrow("Unauthorized");
    });
  });

  describe("getGoal", () => {
    it("returns a goal with category and milestones", async () => {
      const goal = { id: "goal-1", title: "Learn Rust", milestones: [] };
      mockPrisma.goal.findFirst.mockResolvedValue(goal);

      const result = await getGoal("goal-1");

      expect(result).toEqual(goal);
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(getGoal("goal-1")).rejects.toThrow("Unauthorized");
    });
  });

  describe("createGoal", () => {
    it("creates a goal after verifying category ownership", async () => {
      mockPrisma.category.findFirst.mockResolvedValue({ id: "cat-1", userId: "user-1" });
      const goal = { id: "goal-1", title: "Learn Rust" };
      mockPrisma.goal.create.mockResolvedValue(goal);

      const result = await createGoal({
        title: "Learn Rust",
        categoryId: "cat-1",
      });

      expect(result).toEqual(goal);
      expect(mockPrisma.goal.create).toHaveBeenCalledWith({
        data: {
          title: "Learn Rust",
          description: undefined,
          priority: "MEDIUM",
          targetDate: undefined,
          categoryId: "cat-1",
          userId: "user-1",
        },
      });
    });

    it("throws when category not owned by user", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(
        createGoal({ title: "Test", categoryId: "cat-999" })
      ).rejects.toThrow("Category not found");
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(
        createGoal({ title: "Test", categoryId: "cat-1" })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("updateGoal", () => {
    it("updates goal when owner", async () => {
      const goal = { id: "goal-1", userId: "user-1", categoryId: "cat-1", status: "IN_PROGRESS" };
      mockPrisma.goal.findFirst.mockResolvedValue(goal);
      mockPrisma.goal.update.mockResolvedValue({ ...goal, title: "Updated" });

      const result = await updateGoal("goal-1", { title: "Updated" });

      expect(result.title).toBe("Updated");
    });

    it("verifies new category ownership when changing category", async () => {
      const goal = { id: "goal-1", userId: "user-1", categoryId: "cat-1", status: "NOT_STARTED" };
      mockPrisma.goal.findFirst.mockResolvedValueOnce(goal); // goal lookup
      mockPrisma.category.findFirst.mockResolvedValue(null); // new category not found

      await expect(
        updateGoal("goal-1", { categoryId: "cat-999" })
      ).rejects.toThrow("Category not found");
    });

    it("triggers profile update when goal is completed", async () => {
      const { updateProfileFromCompletion } = await import("@/app/actions/ai");
      const goal = { id: "goal-1", userId: "user-1", categoryId: "cat-1", status: "IN_PROGRESS" };
      mockPrisma.goal.findFirst.mockResolvedValue(goal);
      mockPrisma.goal.update.mockResolvedValue({ ...goal, status: "COMPLETED" });

      await updateGoal("goal-1", { status: "COMPLETED" as const });

      expect(updateProfileFromCompletion).toHaveBeenCalledWith("goal-1");
    });

    it("throws when goal not found", async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(null);

      await expect(updateGoal("goal-999", { title: "Test" })).rejects.toThrow(
        "Goal not found"
      );
    });
  });

  describe("deleteGoal", () => {
    it("deletes goal when owner", async () => {
      mockPrisma.goal.findFirst.mockResolvedValue({
        id: "goal-1",
        userId: "user-1",
        categoryId: "cat-1",
      });
      mockPrisma.goal.delete.mockResolvedValue({});

      await deleteGoal("goal-1");

      expect(mockPrisma.goal.delete).toHaveBeenCalledWith({
        where: { id: "goal-1" },
      });
    });

    it("throws when goal not found", async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(null);

      await expect(deleteGoal("goal-999")).rejects.toThrow("Goal not found");
    });
  });

  describe("getDashboardStats", () => {
    it("returns aggregated stats", async () => {
      mockPrisma.goal.count
        .mockResolvedValueOnce(10) // totalGoals
        .mockResolvedValueOnce(3) // completedGoals
        .mockResolvedValueOnce(5); // inProgressGoals
      mockPrisma.milestone.count
        .mockResolvedValueOnce(20) // totalMilestones
        .mockResolvedValueOnce(8); // completedMilestones

      const stats = await getDashboardStats();

      expect(stats).toEqual({
        totalGoals: 10,
        completedGoals: 3,
        inProgressGoals: 5,
        totalMilestones: 20,
        completedMilestones: 8,
        completionRate: 30,
      });
    });

    it("returns 0 completion rate when no goals", async () => {
      mockPrisma.goal.count.mockResolvedValue(0);
      mockPrisma.milestone.count.mockResolvedValue(0);

      const stats = await getDashboardStats();

      expect(stats.completionRate).toBe(0);
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(getDashboardStats()).rejects.toThrow("Unauthorized");
    });
  });
});
