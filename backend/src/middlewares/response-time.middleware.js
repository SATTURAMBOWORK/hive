export function responseTimeMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const originalEnd = res.end;

  res.end = function patchedEnd(...args) {
    const elapsedNs = process.hrtime.bigint() - startedAt;
    const elapsedMs = Number(elapsedNs) / 1e6;
    const roundedMs = elapsedMs.toFixed(2);

    res.setHeader("X-Response-Time", `${roundedMs}ms`);
    res.setHeader("Server-Timing", `app;dur=${roundedMs}`);

    if (elapsedMs >= 500) {
      console.warn(
        `[slow-request] ${req.method} ${req.originalUrl} took ${roundedMs}ms`
      );
    }

    return originalEnd.apply(this, args);
  };

  next();
}