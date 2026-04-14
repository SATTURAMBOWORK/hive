import winston from "winston";

// Winston is a structured logger. Instead of console.log("user logged in"),
// you write logger.info("user logged in", { userId: "abc" }).
// The result is a JSON line: { "level": "info", "message": "user logged in", "userId": "abc", "timestamp": "..." }
// JSON logs are searchable, filterable, and can be piped into tools like Datadog or Logtail.

const { combine, timestamp, json, colorize, simple } = winston.format;

const isProduction = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  // Minimum level to log.
  // In production: only info and above (info, warn, error).
  // In development: debug and above (everything).
  level: isProduction ? "info" : "debug",

  // In production: JSON format — one JSON object per line, easy to pipe into log tools.
  // In development: colorized, human-readable format in the terminal.
  format: isProduction
    ? combine(timestamp(), json())
    : combine(colorize(), simple()),

  transports: [
    new winston.transports.Console(),

    // In production, also write errors to a file.
    // This means if the console output is lost, you still have error.log.
    ...(isProduction
      ? [
          new winston.transports.File({ filename: "logs/error.log", level: "error" }),
          new winston.transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
});
