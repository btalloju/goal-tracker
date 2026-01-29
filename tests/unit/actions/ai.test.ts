import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mock functions
const { mockAuthFn, mockPrisma, mockGenerateContent } = vi.hoisted(() => {
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
    mockGenerateContent: vi.fn(),
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

vi.mock("@/lib/ai/gemini", () => {
  const mockModel = { generateContent: mockGenerateContent };
  return {
    getFlashModel: vi.fn(() => mockModel),
    getProModel: vi.fn(() => mockModel),
    isAIAvailable: vi.fn(() => true),
  };
});

// Import code under test
import {
  generateMilestones,
  prioritizeTasks,
  updateProfileFromCompletion,
  getAIStatus,
} from "@/app/actions/ai";

const DEFAULT_SESSION = {
  user: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

/** Helper: create a mock AI response matching the Gemini SDK shape. */
function aiResponse(json: Record<string, unknown>) {
  return {
    response: {
      text: () => JSON.stringify(json),
    },
  };
}

describe("AI actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthFn.mockResolvedValue(DEFAULT_SESSION);
    mockPrisma.$transaction.mockImplementation(async (args: unknown) => {
      if (typeof args === "function") return (args as Function)(mockPrisma);
      return Promise.all(args as Promise<unknown>[]);
    });
  });

  describe("generateMilestones", () => {
    it("generates milestones for a goal", async () => {
      // Rate limit check: no profile = allowed
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      const milestones = [
        { title: "Step 1", estimatedDays: 7, order: 1 },
        { title: "Step 2", estimatedDays: 14, order: 2 },
      ];
      mockGenerateContent.mockResolvedValue(aiResponse({ milestones }));

      const result = await generateMilestones("Learn TypeScript");

      expect(result.success).toBe(true);
      expect(result.milestones).toEqual(milestones);
    });

    it("returns error when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      const result = await generateMilestones("Test");

      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("returns error when rate limited", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        aiCallsToday: 10,
        lastAICallDate: today,
      });

      const result = await generateMilestones("Test");

      expect(result.success).toBe(false);
      expect(result.error).toContain("limit");
    });

    it("returns error when AI generation fails", async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      mockGenerateContent.mockRejectedValue(new Error("API error"));

      const result = await generateMilestones("Test");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to generate");
    });

    it("increments call count on success", async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      mockGenerateContent.mockResolvedValue(aiResponse({ milestones: [] }));

      await generateMilestones("Test");

      expect(mockPrisma.userProfile.upsert).toHaveBeenCalled();
    });

    it("includes profile context in prompt when profile exists", async () => {
      mockPrisma.userProfile.findUnique
        .mockResolvedValueOnce(null) // rate limit check
        .mockResolvedValueOnce({
          bio: "Software engineer",
          currentRole: "Developer",
          yearsExperience: 5,
          company: "Acme",
          skills: ["JavaScript"],
          skillsGained: ["React"],
        });
      mockGenerateContent.mockResolvedValue(aiResponse({ milestones: [] }));

      await generateMilestones("Learn Rust");

      const prompt = mockGenerateContent.mock.calls[0][0];
      expect(prompt).toContain("Software engineer");
    });
  });

  describe("prioritizeTasks", () => {
    it("prioritizes tasks and returns ordered IDs", async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);
      mockGenerateContent.mockResolvedValue(
        aiResponse({
          orderedTaskIds: ["t-2", "t-1"],
          reasoning: "Deadline first",
        })
      );

      const tasks = [
        { id: "t-1", title: "Task 1" },
        { id: "t-2", title: "Task 2", dueDate: new Date() },
      ];

      const result = await prioritizeTasks(tasks);

      expect(result.success).toBe(true);
      expect(result.orderedTaskIds).toEqual(["t-2", "t-1"]);
    });

    it("rejects with fewer than 2 tasks", async () => {
      const result = await prioritizeTasks([{ id: "t-1", title: "Only one" }]);

      expect(result.success).toBe(false);
      expect(result.error).toContain("at least 2");
    });

    it("returns error when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      const result = await prioritizeTasks([
        { id: "t-1", title: "A" },
        { id: "t-2", title: "B" },
      ]);

      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });
  });

  describe("updateProfileFromCompletion", () => {
    it("extracts skills from completed goal", async () => {
      mockPrisma.goal.findFirst.mockResolvedValue({
        id: "goal-1",
        title: "Learn React",
        description: "Learn React fundamentals",
        milestones: [{ title: "Components" }, { title: "Hooks" }],
      });
      mockGenerateContent.mockResolvedValue(
        aiResponse({ skillsGained: ["React", "Hooks"] })
      );
      mockPrisma.userProfile.upsert.mockResolvedValue({});

      const result = await updateProfileFromCompletion("goal-1");

      expect(result.success).toBe(true);
      expect(result.skillsGained).toEqual(["React", "Hooks"]);
    });

    it("returns success with empty skills when AI unavailable", async () => {
      // Re-import with AI unavailable - this is already mocked as available.
      // Instead, test the error catch path:
      mockPrisma.goal.findFirst.mockResolvedValue({
        id: "goal-1",
        title: "Test",
        milestones: [],
      });
      mockGenerateContent.mockRejectedValue(new Error("API down"));

      const result = await updateProfileFromCompletion("goal-1");

      // Background operation: returns success even on AI error
      expect(result.success).toBe(true);
      expect(result.skillsGained).toEqual([]);
    });

    it("returns error when goal not found", async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(null);

      const result = await updateProfileFromCompletion("goal-999");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Goal not found");
    });
  });

  describe("getAIStatus", () => {
    it("returns available status with remaining calls", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        aiCallsToday: 3,
        lastAICallDate: today,
      });

      const status = await getAIStatus();

      expect(status.available).toBe(true);
      expect(status.remainingCalls).toBe(7);
    });

    it("resets counter for new day", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        aiCallsToday: 10,
        lastAICallDate: yesterday,
      });

      const status = await getAIStatus();

      expect(status.remainingCalls).toBe(10);
    });

    it("returns unavailable when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      const status = await getAIStatus();

      expect(status).toEqual({ available: false, remainingCalls: 0 });
    });
  });
});
