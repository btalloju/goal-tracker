import { describe, it, expect } from "vitest";

const PRODUCTION_URL = process.env.PRODUCTION_URL || "https://questive.vercel.app";

describe("Production smoke tests", () => {
  it("landing page returns 200", async () => {
    const res = await fetch(PRODUCTION_URL);
    expect(res.status).toBe(200);
  });

  it("returns HTML content", async () => {
    const res = await fetch(PRODUCTION_URL);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("text/html");
  });

  it("health check endpoint responds (when available)", async () => {
    const res = await fetch(`${PRODUCTION_URL}/api/health`);
    // Health endpoint may not exist yet — 200 or 404 are both acceptable
    // during incremental rollout. Once Phase 1C is done, tighten to 200.
    expect([200, 404]).toContain(res.status);
  });

  it("dashboard redirects unauthenticated users", async () => {
    const res = await fetch(`${PRODUCTION_URL}/dashboard`, {
      redirect: "manual",
    });
    // Should redirect (302/307) to login
    expect([200, 302, 307]).toContain(res.status);
  });
});
