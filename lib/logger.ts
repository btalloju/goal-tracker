import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: ["token", "password", "secret", "authorization", "cookie"],
});

export const aiLogger = logger.child({ module: "ai" });
export const authLogger = logger.child({ module: "auth" });
export const dbLogger = logger.child({ module: "db" });
export const healthLogger = logger.child({ module: "health" });

export default logger;
