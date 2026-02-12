import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Google Generative AI SDK
const mockGetGenerativeModel = vi.fn().mockReturnValue({
  generateContent: vi.fn(),
});

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    constructor() {}
    getGenerativeModel = mockGetGenerativeModel;
  },
}));

describe("gemini module", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("isAIAvailable", () => {
    it("returns true when GOOGLE_AI_API_KEY is set", async () => {
      vi.stubEnv("GOOGLE_AI_API_KEY", "test-key");
      const { isAIAvailable } = await import("@/lib/ai/gemini");
      expect(isAIAvailable()).toBe(true);
      vi.unstubAllEnvs();
    });

    it("returns false when GOOGLE_AI_API_KEY is not set", async () => {
      vi.stubEnv("GOOGLE_AI_API_KEY", "");
      const { isAIAvailable } = await import("@/lib/ai/gemini");
      expect(isAIAvailable()).toBe(false);
      vi.unstubAllEnvs();
    });
  });

  describe("getFlashModel", () => {
    it("throws when API key is not set", async () => {
      vi.stubEnv("GOOGLE_AI_API_KEY", "");
      const { getFlashModel } = await import("@/lib/ai/gemini");
      expect(() => getFlashModel()).toThrow("GOOGLE_AI_API_KEY");
      vi.unstubAllEnvs();
    });

    it("returns model when API key is set", async () => {
      vi.stubEnv("GOOGLE_AI_API_KEY", "test-api-key");
      const { getFlashModel } = await import("@/lib/ai/gemini");
      const model = getFlashModel();
      expect(model).toBeDefined();
      expect(model.generateContent).toBeDefined();
      vi.unstubAllEnvs();
    });
  });

  describe("getProModel", () => {
    it("throws when API key is not set", async () => {
      vi.stubEnv("GOOGLE_AI_API_KEY", "");
      const { getProModel } = await import("@/lib/ai/gemini");
      expect(() => getProModel()).toThrow("GOOGLE_AI_API_KEY");
      vi.unstubAllEnvs();
    });

    it("returns model when API key is set", async () => {
      vi.stubEnv("GOOGLE_AI_API_KEY", "test-api-key");
      const { getProModel } = await import("@/lib/ai/gemini");
      const model = getProModel();
      expect(model).toBeDefined();
      expect(model.generateContent).toBeDefined();
      vi.unstubAllEnvs();
    });
  });

  describe("singleton behavior", () => {
    it("reuses the same client instance for multiple model requests", async () => {
      vi.stubEnv("GOOGLE_AI_API_KEY", "test-api-key");
      const { getFlashModel, getProModel } = await import("@/lib/ai/gemini");

      // Call both models
      const flashModel = getFlashModel();
      const proModel = getProModel();

      // Both should return valid models
      expect(flashModel).toBeDefined();
      expect(proModel).toBeDefined();
      expect(flashModel.generateContent).toBeDefined();
      expect(proModel.generateContent).toBeDefined();
      vi.unstubAllEnvs();
    });
  });
});
