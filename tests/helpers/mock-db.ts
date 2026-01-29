import { vi } from "vitest";

// Factory to create a mock Prisma model with common methods
function createModelMock() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    upsert: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({ _max: { position: 0 } }),
  };
}

export const mockPrisma = {
  user: createModelMock(),
  userProfile: createModelMock(),
  category: createModelMock(),
  goal: createModelMock(),
  milestone: createModelMock(),
  task: createModelMock(),
  account: createModelMock(),
  session: createModelMock(),
  $transaction: vi.fn(async (args: unknown) => {
    // Support both callback and array forms
    if (typeof args === "function") {
      return args(mockPrisma);
    }
    // Array of promises
    return Promise.all(args as Promise<unknown>[]);
  }),
};

export function mockDb() {
  vi.mock("@/lib/db", () => ({
    db: mockPrisma,
  }));
}

/**
 * Reset all mock implementations and return values.
 * Call in `beforeEach` to get a clean slate.
 */
export function resetDbMocks() {
  for (const model of Object.values(mockPrisma)) {
    if (typeof model === "object" && model !== null) {
      for (const method of Object.values(model)) {
        if (typeof method === "function" && "mockReset" in method) {
          (method as ReturnType<typeof vi.fn>).mockReset();
        }
      }
    }
  }
  // Re-apply default for $transaction
  mockPrisma.$transaction.mockImplementation(async (args: unknown) => {
    if (typeof args === "function") return args(mockPrisma);
    return Promise.all(args as Promise<unknown>[]);
  });
}
