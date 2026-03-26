export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("tenant:join", (tenantId) => {
      if (!tenantId) return;
      socket.join(`tenant:${tenantId}`);
    });

    socket.on("tenant:leave", (tenantId) => {
      if (!tenantId) return;
      socket.leave(`tenant:${tenantId}`);
    });
  });
}
