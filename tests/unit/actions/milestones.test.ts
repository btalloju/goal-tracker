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
  getMilestones,
  createMilestone,
  updateMilestone,
  toggleMilestoneStatus,
  deleteMilestone,
  getUpcomingMilestones,
} from "@/app/actions/milestones";

const DEFAULT_SESSION = {
  user: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

describe("milestone actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthFn.mockResolvedValue(DEFAULT_SESSION);
    mockPrisma.$transaction.mockImplementation(async (args: unknown) => {
      if (typeof args === "function") return (args as Function)(mockPrisma);
      return Promise.all(args as Promise<unknown>[]);
    });
  });

  describe("getMilestones", () => {
    it("returns milestones after verifying goal ownership", async () => {
      mockPrisma.goal.findFirst.mockResolvedValue({ id: "goal-1", userId: "user-1" });
      const milestones = [{ id: "ms-1", title: "Step 1" }];
      mockPrisma.milestone.findMany.mockResolvedValue(milestones);

      const result = await getMilestones("goal-1");

      expect(result).toEqual(milestones);
    });

    it("throws when goal not owned by user", async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(null);

      await expect(getMilestones("goal-999")).rejects.toThrow("Goal not found");
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(getMilestones("goal-1")).rejects.toThrow("Unauthorized");
    });
  });

  describe("createMilestone", () => {
    it("creates milestone after verifying goal ownership", async () => {
      mockPrisma.goal.findFirst.mockResolvedValue({ id: "goal-1", userId: "user-1" });
      const milestone = { id: "ms-1", title: "Step 1", goalId: "goal-1" };
      mockPrisma.milestone.create.mockResolvedValue(milestone);

      const result = await createMilestone({ title: "Step 1", goalId: "goal-1" });

      expect(result).toEqual(milestone);
    });

    it("throws when goal not found", async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(null);

      await expect(
        createMilestone({ title: "Test", goalId: "goal-999" })
      ).rejects.toThrow("Goal not found");
    });
  });

  describe("updateMilestone", () => {
    it("updates milestone when owner", async () => {
      mockPrisma.milestone.findFirst.mockResolvedValue({
        id: "ms-1",
        goal: { userId: "user-1" },
        goalId: "goal-1",
      });
      mockPrisma.milestone.update.mockResolvedValue({ id: "ms-1", title: "Updated" });

      const result = await updateMilestone("ms-1", { title: "Updated" });

      expect(result.title).toBe("Updated");
    });

    it("throws when milestone not found or not owned", async () => {
      mockPrisma.milestone.findFirst.mockResolvedValue(null);

      await expect(updateMilestone("ms-999", { title: "Test" })).rejects.toThrow(
        "Milestone not found"
      );
    });

    it("throws when milestone belongs to another user", async () => {
      mockPrisma.milestone.findFirst.mockResolvedValue({
        id: "ms-1",
        goal: { userId: "other-user" },
      });

      await expect(updateMilestone("ms-1", { title: "Test" })).rejects.toThrow(
        "Milestone not found"
      );
    });
  });

  describe("toggleMilestoneStatus", () => {
    it("toggles PENDING to COMPLETED", async () => {
      mockPrisma.milestone.findFirst.mockResolvedValue({
        id: "ms-1",
        status: "PENDING",
        goal: { userId: "user-1" },
        goalId: "goal-1",
      });
      mockPrisma.milestone.update.mockResolvedValue({
        id: "ms-1",
        status: "COMPLETED",
      });

      const result = await toggleMilestoneStatus("ms-1");

      expect(result.status).toBe("COMPLETED");
      expect(mockPrisma.milestone.update).toHaveBeenCalledWith({
        where: { id: "ms-1" },
        data: {
          status: "COMPLETED",
          completedAt: expect.any(Date),
        },
      });
    });

    it("toggles COMPLETED to PENDING", async () => {
      mockPrisma.milestone.findFirst.mockResolvedValue({
        id: "ms-1",
        status: "COMPLETED",
        goal: { userId: "user-1" },
        goalId: "goal-1",
      });
      mockPrisma.milestone.update.mockResolvedValue({
        id: "ms-1",
        status: "PENDING",
      });

      const result = await toggleMilestoneStatus("ms-1");

      expect(result.status).toBe("PENDING");
      expect(mockPrisma.milestone.update).toHaveBeenCalledWith({
        where: { id: "ms-1" },
        data: {
          status: "PENDING",
          completedAt: null,
        },
      });
    });

    it("throws when not found", async () => {
      mockPrisma.milestone.findFirst.mockResolvedValue(null);

      await expect(toggleMilestoneStatus("ms-999")).rejects.toThrow(
        "Milestone not found"
      );
    });
  });

  describe("deleteMilestone", () => {
    it("deletes milestone when owner", async () => {
      mockPrisma.milestone.findFirst.mockResolvedValue({
        id: "ms-1",
        goal: { userId: "user-1" },
        goalId: "goal-1",
      });
      mockPrisma.milestone.delete.mockResolvedValue({});

      await deleteMilestone("ms-1");

      expect(mockPrisma.milestone.delete).toHaveBeenCalledWith({
        where: { id: "ms-1" },
      });
    });

    it("throws when not found", async () => {
      mockPrisma.milestone.findFirst.mockResolvedValue(null);

      await expect(deleteMilestone("ms-999")).rejects.toThrow("Milestone not found");
    });
  });

  describe("getUpcomingMilestones", () => {
    it("returns pending milestones with future due dates", async () => {
      const milestones = [
        { id: "ms-1", title: "Step 1", goal: { id: "g-1", title: "Goal" } },
      ];
      mockPrisma.milestone.findMany.mockResolvedValue(milestones);

      const result = await getUpcomingMilestones(5);

      expect(result).toEqual(milestones);
      expect(mockPrisma.milestone.findMany).toHaveBeenCalledWith({
        where: {
          goal: { userId: "user-1" },
          status: "PENDING",
          dueDate: { gte: expect.any(Date) },
        },
        include: {
          goal: { select: { id: true, title: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      });
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(getUpcomingMilestones()).rejects.toThrow("Unauthorized");
    });
  });
});
