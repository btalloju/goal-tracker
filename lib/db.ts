import { PrismaClient } from "@prisma/client";
import { dbLogger } from "@/lib/logger";

const SLOW_QUERY_THRESHOLD_MS = 100;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

export const db = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        const result = await query(args);
        const duration = performance.now() - start;

        if (duration > SLOW_QUERY_THRESHOLD_MS) {
          dbLogger.warn(
            { model, operation, duration: Math.round(duration) },
            "Slow query detected"
          );
        }

        return result;
      },
    },
  },
}) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;
