import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { healthLogger } from "@/lib/logger";

interface HealthCheck {
  status: "ok" | "error";
  latency?: number;
  message?: string;
}

export async function GET() {
  const checks: Record<string, HealthCheck> = {};

  // Database check
  try {
    const start = performance.now();
    await db.$queryRaw`SELECT 1`;
    const latency = Math.round(performance.now() - start);
    checks.database = { status: "ok", latency };
  } catch (error) {
    healthLogger.error({ err: error }, "Health check: database unreachable");
    checks.database = { status: "error", message: "Database unreachable" };
  }

  // AI config check (env var presence)
  checks.ai = {
    status: process.env.GOOGLE_AI_API_KEY ? "ok" : "error",
    message: process.env.GOOGLE_AI_API_KEY ? undefined : "GOOGLE_AI_API_KEY not set",
  };

  // Auth config check (env var presence)
  const hasAuth =
    !!process.env.AUTH_SECRET &&
    !!process.env.GOOGLE_CLIENT_ID &&
    !!process.env.GOOGLE_CLIENT_SECRET;
  checks.auth = {
    status: hasAuth ? "ok" : "error",
    message: hasAuth ? undefined : "Auth environment variables missing",
  };

  const dbDown = checks.database.status === "error";
  const allOk = Object.values(checks).every((c) => c.status === "ok");
  const status = dbDown ? "down" : allOk ? "ok" : "degraded";

  const body = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "unknown",
    checks,
  };

  return NextResponse.json(body, {
    status: dbDown ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
