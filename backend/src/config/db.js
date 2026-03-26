import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
}
