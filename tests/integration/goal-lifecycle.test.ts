import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests that exercise multi-step flows with a mock DB.
 *
 * When Phase 1A matures, these will use a real PostgreSQL via Docker.
 * For now they validate the logical flow across action boundaries
 * using the same mock infrastructure as unit tests.
 */

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

// Mock AI module (used by goals via updateProfileFromCompletion)
vi.mock("@/app/actions/ai", () => ({
  updateProfileFromCompletion: vi.fn().mockResolvedValue({ success: true }),
}));

// Import code under test
import { createCategory, getCategories } from "@/app/actions/categories";
import { createGoal, updateGoal, getDashboardStats } from "@/app/actions/goals";
import { createMilestone, toggleMilestoneStatus } from "@/app/actions/milestones";

const DEFAULT_SESSION = {
  user: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

describe("Goal lifecycle integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthFn.mockResolvedValue(DEFAULT_SESSION);
    mockPrisma.$transaction.mockImplementation(async (args: unknown) => {
      if (typeof args === "function") return (args as Function)(mockPrisma);
      return Promise.all(args as Promise<unknown>[]);
    });
  });

  it("create category → goal → milestone → complete flow", async () => {
    // Step 1: Create category
    const category = { id: "cat-1", name: "Learning", userId: "user-1" };
    mockPrisma.category.create.mockResolvedValue(category);

    const createdCat = await createCategory({ name: "Learning" });
    expect(createdCat.name).toBe("Learning");

    // Step 2: Create goal in category
    mockPrisma.category.findFirst.mockResolvedValue(category);
    const goal = { id: "goal-1", title: "Learn TypeScript", categoryId: "cat-1", status: "NOT_STARTED" };
    mockPrisma.goal.create.mockResolvedValue(goal);

    const createdGoal = await createGoal({
      title: "Learn TypeScript",
      categoryId: "cat-1",
    });
    expect(createdGoal.title).toBe("Learn TypeScript");

    // Step 3: Create milestone
    mockPrisma.goal.findFirst.mockResolvedValue({ id: "goal-1", userId: "user-1" });
    const milestone = { id: "ms-1", title: "Basics", status: "PENDING", goalId: "goal-1" };
    mockPrisma.milestone.create.mockResolvedValue(milestone);

    const createdMs = await createMilestone({
      title: "Basics",
      goalId: "goal-1",
    });
    expect(createdMs.title).toBe("Basics");

    // Step 4: Complete milestone
    mockPrisma.milestone.findFirst.mockResolvedValue({
      ...milestone,
      goal: { userId: "user-1" },
    });
    mockPrisma.milestone.update.mockResolvedValue({
      ...milestone,
      status: "COMPLETED",
    });

    const toggled = await toggleMilestoneStatus("ms-1");
    expect(toggled.status).toBe("COMPLETED");

    // Step 5: Complete goal
    mockPrisma.goal.findFirst.mockResolvedValue({
      id: "goal-1",
      userId: "user-1",
      categoryId: "cat-1",
      status: "IN_PROGRESS",
    });
    mockPrisma.goal.update.mockResolvedValue({
      id: "goal-1",
      status: "COMPLETED",
    });

    const completedGoal = await updateGoal("goal-1", { status: "COMPLETED" as const });
    expect(completedGoal.status).toBe("COMPLETED");

    // Step 6: Verify stats reflect completion
    mockPrisma.goal.count
      .mockResolvedValueOnce(1)  // total
      .mockResolvedValueOnce(1)  // completed
      .mockResolvedValueOnce(0); // in progress
    mockPrisma.milestone.count
      .mockResolvedValueOnce(1)  // total
      .mockResolvedValueOnce(1); // completed

    const stats = await getDashboardStats();
    expect(stats.completionRate).toBe(100);
    expect(stats.completedGoals).toBe(1);
  });
});
