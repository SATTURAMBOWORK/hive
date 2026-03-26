export async function listAmenityBookings(_req, res) {
  // TODO (Learning Step): implement tenant booking list
  res.json({ message: "Implement listAmenityBookings", items: [] });
}

export async function createAmenityBooking(_req, res) {
  // TODO (Learning Step): implement conflict check and booking creation
  res.status(201).json({ message: "Implement createAmenityBooking" });
}
