import { vi } from "vitest";

export const mockGenerateContent = vi.fn();

const mockModel = {
  generateContent: mockGenerateContent,
};

/**
 * Mock `@/lib/ai/gemini` with a controllable model.
 *
 * Use `mockGenerateContent.mockResolvedValue(...)` in individual tests
 * to control AI responses.
 */
export function mockAI(available = true) {
  vi.mock("@/lib/ai/gemini", () => ({
    getFlashModel: vi.fn(() => mockModel),
    getProModel: vi.fn(() => mockModel),
    isAIAvailable: vi.fn(() => available),
  }));
}

/**
 * Helper: create a mock AI response matching the Gemini SDK shape.
 */
export function aiResponse(json: Record<string, unknown>) {
  return {
    response: {
      text: () => JSON.stringify(json),
    },
  };
}
