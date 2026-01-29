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
import { getProfile, deleteAccount } from "@/app/actions/account";

const DEFAULT_SESSION = {
  user: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

describe("account actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthFn.mockResolvedValue(DEFAULT_SESSION);
    mockPrisma.$transaction.mockImplementation(async (args: unknown) => {
      if (typeof args === "function") return (args as Function)(mockPrisma);
      return Promise.all(args as Promise<unknown>[]);
    });
  });

  describe("getProfile", () => {
    it("returns user profile when authenticated", async () => {
      const user = {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        image: null,
        createdAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await getProfile();

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      });
    });

    it("returns null when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      const result = await getProfile();

      expect(result).toBeNull();
    });
  });

  describe("deleteAccount", () => {
    it("deletes user and signs out", async () => {
      mockPrisma.user.delete.mockResolvedValue({});

      const result = await deleteAccount();

      expect(result).toEqual({ success: true });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
    });

    it("returns error when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      const result = await deleteAccount();

      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("returns error when deletion fails", async () => {
      mockPrisma.user.delete.mockRejectedValue(new Error("DB error"));

      const result = await deleteAccount();

      expect(result).toEqual({ success: false, error: "Failed to delete account" });
    });
  });
});
