import mongoose from "mongoose";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import { Tenant } from "../models/tenant.model.js";

async function cleanup() {
  const tenantSlug = process.argv[2] || "sunrise-heights";
  const email = process.argv[3] || "testsuper@sunrise.com";

  await mongoose.connect(env.mongoUri);

  const tenant = await Tenant.findOne({ slug: tenantSlug });
  if (!tenant) {
    console.log(JSON.stringify({ deletedUsers: 0, tenantDeleted: 0, note: "tenant_not_found" }));
    await mongoose.disconnect();
    return;
  }

  const beforeUsers = await User.countDocuments({ tenantId: tenant._id });
  const userDeleteRes = await User.deleteMany({ tenantId: tenant._id, email });
  const afterUsers = await User.countDocuments({ tenantId: tenant._id });

  let tenantDeleted = 0;
  if (afterUsers === 0) {
    const tenantDeleteRes = await Tenant.deleteOne({ _id: tenant._id });
    tenantDeleted = tenantDeleteRes.deletedCount;
  }

  console.log(
    JSON.stringify({
      tenantSlug,
      email,
      beforeUsers,
      deletedUsers: userDeleteRes.deletedCount,
      afterUsers,
      tenantDeleted
    })
  );

  await mongoose.disconnect();
}

cleanup().catch((error) => {
  console.error(error);
  process.exit(1);
});
