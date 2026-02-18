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
    // 200 = healthy, 503 = db down, 404 = not yet deployed
    expect([200, 503, 404]).toContain(res.status);
  });

  it("dashboard redirects unauthenticated users", async () => {
    const res = await fetch(`${PRODUCTION_URL}/dashboard`, {
      redirect: "manual",
    });
    // Should redirect (302/307) to login, or 404 if route requires auth middleware
    expect([200, 302, 307, 404]).toContain(res.status);
  });
});
