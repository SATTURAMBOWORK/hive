import mongoose from "mongoose";
import { env } from "../config/env.js";
import { Tenant } from "../models/tenant.model.js";

async function seed() {
  await mongoose.connect(env.mongoUri);

  const slug = process.argv[2] || "green-heights";
  const name = process.argv[3] || "Green Heights";

  const existing = await Tenant.findOne({ slug });
  if (existing) {
    console.log(`Tenant already exists: ${slug}`);
  } else {
    await Tenant.create({ slug, name, city: "Bangalore" });
    console.log(`Tenant created: ${slug}`);
  }

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
