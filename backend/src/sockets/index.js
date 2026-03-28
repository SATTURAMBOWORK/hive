export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("user:join", (userId) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
    });

    socket.on("user:leave", (userId) => {
      if (!userId) return;
      socket.leave(`user:${userId}`);
    });

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
