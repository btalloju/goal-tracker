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
  getExtendedProfile,
  createOrUpdateProfile,
  getSkillsGained,
} from "@/app/actions/profile";

const DEFAULT_SESSION = {
  user: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

describe("profile actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthFn.mockResolvedValue(DEFAULT_SESSION);
    mockPrisma.$transaction.mockImplementation(async (args: unknown) => {
      if (typeof args === "function") return (args as Function)(mockPrisma);
      return Promise.all(args as Promise<unknown>[]);
    });
  });

  describe("getExtendedProfile", () => {
    it("returns profile when authenticated", async () => {
      const profile = {
        id: "prof-1",
        userId: "user-1",
        currentRole: "Developer",
        skills: ["TypeScript"],
        skillsGained: [],
        completedGoalsCount: 0,
      };
      mockPrisma.userProfile.findUnique.mockResolvedValue(profile);

      const result = await getExtendedProfile();

      expect(result).toEqual(profile);
    });

    it("returns null when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      const result = await getExtendedProfile();

      expect(result).toBeNull();
    });

    it("returns null when profile does not exist", async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      const result = await getExtendedProfile();

      expect(result).toBeNull();
    });
  });

  describe("createOrUpdateProfile", () => {
    it("upserts profile data", async () => {
      mockPrisma.userProfile.upsert.mockResolvedValue({});

      const result = await createOrUpdateProfile({
        currentRole: "Engineer",
        yearsExperience: 5,
        company: "Acme",
        skills: ["TypeScript", "React"],
        bio: "Full-stack dev",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        create: {
          userId: "user-1",
          currentRole: "Engineer",
          yearsExperience: 5,
          company: "Acme",
          skills: ["TypeScript", "React"],
          bio: "Full-stack dev",
        },
        update: {
          currentRole: "Engineer",
          yearsExperience: 5,
          company: "Acme",
          skills: ["TypeScript", "React"],
          bio: "Full-stack dev",
        },
      });
    });

    it("handles empty optional fields", async () => {
      mockPrisma.userProfile.upsert.mockResolvedValue({});

      const result = await createOrUpdateProfile({});

      expect(result).toEqual({ success: true });
      expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        create: expect.objectContaining({
          userId: "user-1",
          currentRole: null,
          yearsExperience: null,
          company: null,
          skills: [],
          bio: null,
        }),
        update: expect.objectContaining({
          currentRole: null,
          yearsExperience: null,
          company: null,
          skills: [],
          bio: null,
        }),
      });
    });

    it("returns error when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      const result = await createOrUpdateProfile({ bio: "test" });

      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("returns error when upsert fails", async () => {
      mockPrisma.userProfile.upsert.mockRejectedValue(new Error("DB error"));

      const result = await createOrUpdateProfile({ bio: "test" });

      expect(result).toEqual({ success: false, error: "Failed to update profile" });
    });
  });

  describe("getSkillsGained", () => {
    it("returns skills array", async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        skillsGained: ["React", "TypeScript"],
      });

      const result = await getSkillsGained();

      expect(result).toEqual(["React", "TypeScript"]);
    });

    it("returns empty array when no profile", async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      const result = await getSkillsGained();

      expect(result).toEqual([]);
    });

    it("returns empty array when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      const result = await getSkillsGained();

      expect(result).toEqual([]);
    });
  });
});
