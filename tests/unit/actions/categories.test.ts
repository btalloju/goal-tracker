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
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/categories";

const DEFAULT_SESSION = {
  user: { id: "user-1", name: "Test User", email: "test@example.com", image: null },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

describe("category actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthFn.mockResolvedValue(DEFAULT_SESSION);
    mockPrisma.$transaction.mockImplementation(async (args: unknown) => {
      if (typeof args === "function") return (args as Function)(mockPrisma);
      return Promise.all(args as Promise<unknown>[]);
    });
  });

  describe("getCategories", () => {
    it("returns all categories for the user", async () => {
      const categories = [
        { id: "cat-1", name: "Health", goals: [] },
        { id: "cat-2", name: "Career", goals: [] },
      ];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await getCategories();

      expect(result).toEqual(categories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: { goals: { select: { id: true, status: true } } },
        orderBy: { createdAt: "desc" },
      });
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(getCategories()).rejects.toThrow("Unauthorized");
    });
  });

  describe("getCategory", () => {
    it("returns a single category with goals and milestones", async () => {
      const category = { id: "cat-1", name: "Health", goals: [] };
      mockPrisma.category.findFirst.mockResolvedValue(category);

      const result = await getCategory("cat-1");

      expect(result).toEqual(category);
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: { id: "cat-1", userId: "user-1" },
        include: {
          goals: {
            include: { milestones: true },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(getCategory("cat-1")).rejects.toThrow("Unauthorized");
    });
  });

  describe("createCategory", () => {
    it("creates a category with defaults", async () => {
      const category = {
        id: "cat-1",
        name: "Fitness",
        color: "#3b82f6",
        icon: "folder",
        userId: "user-1",
      };
      mockPrisma.category.create.mockResolvedValue(category);

      const result = await createCategory({ name: "Fitness" });

      expect(result).toEqual(category);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "Fitness",
          color: "#3b82f6",
          icon: "folder",
          userId: "user-1",
        },
      });
    });

    it("creates a category with custom color and icon", async () => {
      mockPrisma.category.create.mockResolvedValue({});

      await createCategory({ name: "Health", color: "#ff0000", icon: "heart" });

      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "Health",
          color: "#ff0000",
          icon: "heart",
          userId: "user-1",
        },
      });
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(createCategory({ name: "Test" })).rejects.toThrow("Unauthorized");
    });
  });

  describe("updateCategory", () => {
    it("updates category when owner", async () => {
      mockPrisma.category.findFirst.mockResolvedValue({ id: "cat-1", userId: "user-1" });
      mockPrisma.category.update.mockResolvedValue({ id: "cat-1", name: "Updated" });

      const result = await updateCategory("cat-1", { name: "Updated" });

      expect(result).toEqual({ id: "cat-1", name: "Updated" });
    });

    it("throws when category not found (ownership check)", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(updateCategory("cat-999", { name: "Test" })).rejects.toThrow(
        "Category not found"
      );
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(updateCategory("cat-1", { name: "Test" })).rejects.toThrow(
        "Unauthorized"
      );
    });
  });

  describe("deleteCategory", () => {
    it("deletes category when owner", async () => {
      mockPrisma.category.findFirst.mockResolvedValue({ id: "cat-1", userId: "user-1" });
      mockPrisma.category.delete.mockResolvedValue({});

      await deleteCategory("cat-1");

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: "cat-1" },
      });
    });

    it("throws when category not found", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(deleteCategory("cat-999")).rejects.toThrow("Category not found");
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(deleteCategory("cat-1")).rejects.toThrow("Unauthorized");
    });
  });
});
