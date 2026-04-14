import { Router } from "express";
import mongoose from "mongoose";

const healthRouter = Router();

// UptimeRobot pings this endpoint every 5 minutes.
// Returning 200 just proves Express is alive — useless if the DB is down.
// We check mongoose.connection.readyState so a DB outage is caught too.
//
// readyState values:
//   0 = disconnected
//   1 = connected  ← the only "healthy" state
//   2 = connecting
//   3 = disconnecting

healthRouter.get("/", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbHealthy = dbState === 1;

  const status = {
    ok: dbHealthy,
    service: "AptHive API",
    timestamp: new Date().toISOString(),
    db: dbHealthy ? "connected" : "unavailable",
  };

  // Return 503 (Service Unavailable) if DB is down.
  // UptimeRobot treats any non-2xx as a failure and alerts you.
  res.status(dbHealthy ? 200 : 503).json(status);
});

export { healthRouter };
