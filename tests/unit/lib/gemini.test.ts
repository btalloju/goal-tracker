import { describe, it, expect, vi, beforeEach } from "vitest";

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
  });

  describe("getProModel", () => {
    it("throws when API key is not set", async () => {
      vi.stubEnv("GOOGLE_AI_API_KEY", "");
      const { getProModel } = await import("@/lib/ai/gemini");
      expect(() => getProModel()).toThrow("GOOGLE_AI_API_KEY");
      vi.unstubAllEnvs();
    });
  });
});
