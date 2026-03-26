export async function listAnnouncements(_req, res) {
  // TODO (Learning Step):
  // 1) Read req.tenantId
  // 2) Query Announcement.find({ tenantId: req.tenantId })
  // 3) Sort newest first and return JSON
  res.json({
    message: "Implement listAnnouncements",
    items: []
  });
}

export async function createAnnouncement(_req, res) {
  // TODO (Learning Step):
  // 1) Validate title/body
  // 2) Save tenant-scoped announcement
  // 3) Emit socket event: io.to(`tenant:${tenantId}`).emit("announcement:created", payload)
  res.status(201).json({ message: "Implement createAnnouncement" });
}
