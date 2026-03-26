export async function listEvents(_req, res) {
  // TODO (Learning Step): implement tenant event list
  res.json({ message: "Implement listEvents", items: [] });
}

export async function createEvent(_req, res) {
  // TODO (Learning Step): implement event creation + socket broadcast
  res.status(201).json({ message: "Implement createEvent" });
}
