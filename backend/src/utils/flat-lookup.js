import { SocietyWing } from "../models/society-wing.model.js";
import { SocietyUnit } from "../models/society-unit.model.js";
import { Membership } from "../models/membership.model.js";

// Split "A-101" into { wingName: "A", unitNumber: "101" }
// If there is no dash (e.g. "101"), wingName is null
export function parseFlatNumber(flat) {
  const idx = flat.indexOf("-");
  if (idx === -1) return { wingName: null, unitNumber: flat };
  return { wingName: flat.slice(0, idx).toUpperCase(), unitNumber: flat.slice(idx + 1) };
}

// Given a human-readable flat string (e.g. "A-101"), find the approved
// resident's userId for that flat within a tenant.
// Returns the userId ObjectId, or null if not found.
export async function findResidentForFlat(tenantId, flatNumber) {
  const { wingName, unitNumber } = parseFlatNumber(flatNumber);

  let unitQuery = { tenantId, unitNumber };

  if (wingName) {
    const wing = await SocietyWing.findOne({ tenantId, name: wingName });
    if (!wing) return null;
    unitQuery.wingId = wing._id;
  }

  const unit = await SocietyUnit.findOne(unitQuery);
  if (!unit) return null;

  const membership = await Membership.findOne({
    tenantId,
    unitId: unit._id,
    status: "approved"
  });

  return membership?.userId || null;
}
