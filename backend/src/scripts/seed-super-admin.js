import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { ROLES } from "../config/roles.js";
import { Tenant } from "../models/tenant.model.js";
import { User } from "../models/user.model.js";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function seedSuperAdmin() {
  await mongoose.connect(env.mongoUri);

  const tenantSlug = sanitizeText(process.argv[2]).toLowerCase() || "green-heights";
  const email = sanitizeText(process.argv[3]).toLowerCase() || "admin@green-heights.com";
  const password = sanitizeText(process.argv[4]) || "SuperAdmin@123";
  const fullName = sanitizeText(process.argv[5]) || "Platform Super Admin";

  const tenant = await Tenant.findOne({ slug: tenantSlug });
  if (!tenant) {
    throw new Error(`Tenant not found for slug: ${tenantSlug}. Run seed:tenant first.`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ tenantId: tenant._id, email });

  if (existing) {
    existing.fullName = fullName;
    existing.passwordHash = passwordHash;
    existing.role = ROLES.SUPER_ADMIN;
    await existing.save();
    console.log(`Updated existing user as super_admin: ${email}`);
  } else {
    await User.create({
      tenantId: tenant._id,
      fullName,
      email,
      passwordHash,
      role: ROLES.SUPER_ADMIN
    });
    console.log(`Created super_admin user: ${email}`);
  }

  console.log(`Tenant slug: ${tenantSlug}`);
  await mongoose.disconnect();
}

seedSuperAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
