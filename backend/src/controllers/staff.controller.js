import { StatusCodes } from "http-status-codes";
import { Staff, STAFF_CATEGORIES, STAFF_DAYS } from "../models/staff.model.js";
import { StaffEntry } from "../models/staff-entry.model.js";
import { Membership } from "../models/membership.model.js";
import { Notification } from "../models/notification.model.js";
import { AppError } from "../utils/app-error.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";

// ── Helpers ──────────────────────────────────────────────────────

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/*
  generateStaffCode — creates a unique 6-character alphanumeric code.
  e.g. "A1B2C3" — encoded in the QR card, guard types this as fallback.

  HINT: Use Math.random() + toString(36) to generate random alphanumeric chars.
        toString(36) converts a number to base-36 (0-9 + a-z).
        Slice to get 6 characters, then toUpperCase().
        Example: Math.random().toString(36).slice(2, 8).toUpperCase()
*/
function generateStaffCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/*
  getFlatForResident — looks up the resident's flat number from their membership.
  Returns "A-401" style string or null if not found.

  HINT: You've seen this exact function in visitor-prereg.controller.js
        and freq-visitor.controller.js. Same pattern:
        1. Membership.findOne({ tenantId, userId: residentId, status: "approved" })
        2. .populate("wingId", "name") and .populate("unitId", "unitNumber")
        3. Return `${wingId.name}-${unitId.unitNumber}` or null
*/
async function getFlatForResident(tenantId, residentId) {
  const membership = await Membership.findOne({
    tenantId,
    userId: residentId,
    status: "approved",
  })
    .populate("wingId", "name")
    .populate("unitId", "unitNumber");

  if (!membership) {
    return null;
  }
  // Add this before the return
  if (!membership?.wingId || !membership?.unitId) return null;

  return `${membership.wingId.name}-${membership.unitId.unitNumber}`;
}

/*
  scheduleStatus — checks if right now is within a staff assignment's allowed window.
  Returns: "ok" | "wrong_day" | "wrong_time"

  HINT: Exact same logic as in freq-visitor.controller.js.
        1. Get current day name (sun/mon/tue...) from new Date().getDay()
        2. Get current time as "HH:MM" string
        3. Check if currentDay is in assignment.allowedDays
        4. Check if currentTime is between allowedFrom and allowedUntil
*/
function scheduleStatus(assignment) {
  const currentDay = new Date().getDay();
  // Correct — build "HH:MM" manually using padStart
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  // gives "08:45" — can now compare with "08:00" and "10:00"

  // Correct — allowedDays is the array inside assignment
  // Also need to convert getDay() number → day name first
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const currentDayName = dayNames[currentDay]; // e.g. "mon"
  if (!assignment.allowedDays.includes(currentDayName)) return "wrong_day";

  if (time < assignment.allowedFrom || time > assignment.allowedUntil)
    return "wrong_time";

  return "ok";
}

// ── Resident / Committee: Staff Onboarding ───────────────────────
/*
  POST /api/staff
  Resident onboards their domestic staff (maid, cook, driver, nanny).
  Committee onboards society staff (security, housekeeping, gardener).

  HINT: Very similar to addOrLinkFreqVisitor in freq-visitor.controller.js.
  Steps:
    1. Sanitize inputs: name, phone, category, description from req.body
       allowedDays from JSON.parse(req.body?.allowedDays || "[]")
       allowedFrom, allowedUntil as time strings
    2. Validate: name required, phone required, category in STAFF_CATEGORIES
       allowedFrom/allowedUntil match TIME_REGEX (/^([01]\d|2[0-3]):[0-5]\d$/)
    3. Get flat number for this resident using getFlatForResident()
    4. Upload photo if req.file exists → uploadToCloudinary(req.file.buffer, { folder: "staff" })
    5. Generate staffCode using generateStaffCode() — retry if collision
    6. Check if phone already exists in this tenant:
         IF NOT: create new Staff document with the assignment
         IF YES:  add/update this resident's assignment (same as freq-visitor pattern)
    7. Return populated staff document
*/
export async function onboardStaff(req, res, next) {
  try {
    // ── Step 1: Sanitize inputs ──────────────────────────────────
    const name        = sanitizeText(req.body?.name);
    const phone       = sanitizeText(req.body?.phone).replace(/\D/g, ""); // digits only
    const category    = sanitizeText(req.body?.category) || "other";
    const description = sanitizeText(req.body?.description);
    const allowedFrom  = sanitizeText(req.body?.allowedFrom)  || "00:00";
    const allowedUntil = sanitizeText(req.body?.allowedUntil) || "23:59";

    // allowedDays arrives as a JSON string from FormData e.g. '["mon","tue"]'
    let allowedDays = [];
    try {
      allowedDays = JSON.parse(req.body?.allowedDays || "[]");
    } catch {
      allowedDays = [];
    }

    // ── Step 2: Validate ─────────────────────────────────────────
    const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!name)  throw new AppError("name is required",  StatusCodes.BAD_REQUEST);
    if (!phone) throw new AppError("phone is required", StatusCodes.BAD_REQUEST);

    if (!STAFF_CATEGORIES.includes(category)) {
      throw new AppError(
        `category must be one of: ${STAFF_CATEGORIES.join(", ")}`,
        StatusCodes.BAD_REQUEST
      );
    }
    if (!TIME_REGEX.test(allowedFrom)) {
      throw new AppError("allowedFrom must be HH:MM format", StatusCodes.BAD_REQUEST);
    }
    if (!TIME_REGEX.test(allowedUntil)) {
      throw new AppError("allowedUntil must be HH:MM format", StatusCodes.BAD_REQUEST);
    }
    if (allowedUntil <= allowedFrom) {
      throw new AppError("allowedUntil must be after allowedFrom", StatusCodes.BAD_REQUEST);
    }

    const invalidDays = allowedDays.filter(d => !STAFF_DAYS.includes(d));
    if (invalidDays.length) {
      throw new AppError(
        `Invalid days: ${invalidDays.join(", ")}. Use: ${STAFF_DAYS.join(", ")}`,
        StatusCodes.BAD_REQUEST
      );
    }

    // ── Step 3: Get this resident's flat number ───────────────────
    const flatNumber = await getFlatForResident(req.tenantId, req.user.userId);
    if (!flatNumber) {
      throw new AppError("Your membership is not approved yet", StatusCodes.FORBIDDEN);
    }

    // ── Step 4: Upload photo to Cloudinary if provided ───────────
    let photoUrl = "";
    if (req.file) {
      photoUrl = await uploadToCloudinary(req.file.buffer, { folder: "staff" });
    }

    // ── Step 5: Generate unique staffCode (retry on collision) ────
    let staffCode;
    let attempts = 0;
    do {
      staffCode = generateStaffCode();
      const existing = await Staff.findOne({ staffCode });
      if (!existing) break;
      attempts++;
    } while (attempts < 5);

    // ── Step 6: Check if this phone already exists in tenant ──────
    let staff = await Staff.findOne({ tenantId: req.tenantId, phone });

    if (!staff) {
      // First time this staff is being added — create fresh document
      staff = await Staff.create({
        tenantId: req.tenantId,
        name,
        phone,
        photoUrl,
        category,
        description,
        staffCode,
        assignments: [{
          residentId:   req.user.userId,
          flatNumber,
          allowedDays,
          allowedFrom,
          allowedUntil
        }]
      });
    } else {
      // Staff already in system — add or update this resident's assignment
      const existingIdx = staff.assignments.findIndex(
        a => String(a.residentId) === String(req.user.userId)
      );

      const assignmentData = {
        residentId: req.user.userId,
        flatNumber,
        allowedDays,
        allowedFrom,
        allowedUntil
      };

      if (existingIdx >= 0) {
        // Update existing assignment
        staff.assignments[existingIdx] = {
          ...staff.assignments[existingIdx],
          ...assignmentData
        };
      } else {
        // Add new assignment for this resident
        staff.assignments.push(assignmentData);
      }

      // Update shared fields only if provided in this request
      if (name)        staff.name        = name;
      if (category)    staff.category    = category;
      if (description) staff.description = description;
      if (photoUrl)    staff.photoUrl    = photoUrl;

      await staff.save();
    }

    // ── Step 7: Return populated document ────────────────────────
    const populated = await Staff.findById(staff._id)
      .populate("assignments.residentId", "fullName");

    res.status(StatusCodes.CREATED).json({ item: populated });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("Staff with this phone already exists. Try again.", StatusCodes.CONFLICT));
    }
    next(error);
  }
}

/*
  GET /api/staff/mine
  Resident lists all staff assigned to their flat.

  HINT: Same as listMyFreqVisitors in freq-visitor.controller.js.
  Steps:
    1. Find all Staff where "assignments.residentId" === req.user.userId
       AND tenantId === req.tenantId
    2. For each staff, extract only this resident's assignment (myAssignment)
       using .find() on the assignments array
    3. Return the sanitized list
*/
export async function listMyStaff(req, res, next) {
  try {
    // Find all Staff documents where this resident has an assignment
    const staffList = await Staff.find({
      tenantId: req.tenantId,
      "assignments.residentId": req.user.userId  // dot notation to query inside array
    }).sort({ name: 1 });

    // For each staff, expose only THIS resident's assignment
    // Other residents' schedules are not their business
    const sanitized = staffList.map(s => ({
      _id:          s._id,
      name:         s.name,
      phone:        s.phone,
      photoUrl:     s.photoUrl,
      category:     s.category,
      description:  s.description,
      staffCode:    s.staffCode,
      myAssignment: s.assignments.find(
        a => String(a.residentId) === String(req.user.userId)
      )
    }));

    res.json({ items: sanitized });
  } catch (error) {
    next(error);
  }
}

/*
  GET /api/staff/society
  Committee lists ALL staff in this society (all categories, all assignments).

  HINT: Simpler than listMyStaff — no filtering by residentId.
  Steps:
    1. Staff.find({ tenantId: req.tenantId }).sort({ name: 1 })
    2. Populate assignments.residentId with "fullName"
    3. Return items
*/
export async function listAllStaff(req, res, next) {
  try {
    const staflist=await Staff.find({tenantId:req.tenantId}).sort({name:1})
    .populate("assignments.residentId","fullName");
    res.json({ items: staflist });
    
  } catch (error) {
    next(error);
  }
}

/*
  PATCH /api/staff/:id/my-assignment
  Resident updates their assignment's schedule (allowedDays, allowedFrom, allowedUntil).

  HINT: Same as updateMyLink in freq-visitor.controller.js.
  Steps:
    1. Parse allowedDays from JSON, get allowedFrom/allowedUntil
    2. Find Staff by _id + tenantId
    3. Find this resident's assignment using assignments.findIndex()
    4. Update the fields, save
*/
export async function updateMyAssignment(req, res, next) {
  try {
    // Step 1: Parse inputs
    let allowedDays = [];
    try { allowedDays = JSON.parse(req.body?.allowedDays || "[]"); } catch { allowedDays = []; }

    const allowedFrom  = sanitizeText(req.body?.allowedFrom);
    const allowedUntil = sanitizeText(req.body?.allowedUntil);

    const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (allowedFrom  && !TIME_REGEX.test(allowedFrom))  throw new AppError("allowedFrom must be HH:MM",  StatusCodes.BAD_REQUEST);
    if (allowedUntil && !TIME_REGEX.test(allowedUntil)) throw new AppError("allowedUntil must be HH:MM", StatusCodes.BAD_REQUEST);

    // Step 2: Find the staff document by _id + tenantId
    // req.params.id comes from the URL: PATCH /api/staff/:id/my-assignment
    const staff = await Staff.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!staff) throw new AppError("Staff member not found", StatusCodes.NOT_FOUND);

    // Step 3: Find this resident's assignment index
    const idx = staff.assignments.findIndex(
      a => String(a.residentId) === String(req.user.userId)
    );
    if (idx === -1) throw new AppError("You have not assigned this staff member", StatusCodes.FORBIDDEN);

    // Step 4: Update only the fields that were provided
    if (allowedDays.length) staff.assignments[idx].allowedDays  = allowedDays;
    if (allowedFrom)        staff.assignments[idx].allowedFrom   = allowedFrom;
    if (allowedUntil)       staff.assignments[idx].allowedUntil  = allowedUntil;

    await staff.save();

    res.json({ item: staff });
  } catch (error) {
    next(error);
  }
}

/*
  DELETE /api/staff/:id/my-assignment
  Resident removes their flat from this staff member's assignments.
  If no assignments remain → delete the whole Staff document.

  HINT: Same as removeMyLink in freq-visitor.controller.js.
  Steps:
    1. Find Staff by _id + tenantId
    2. Filter out this resident's assignment from assignments array
    3. If assignments.length === 0 → deleteOne (no one uses this staff anymore)
       Else → save
*/
export async function removeMyAssignment(req, res, next) {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!staff) throw new AppError("Staff member not found", StatusCodes.NOT_FOUND);

    const idx = staff.assignments.findIndex(
      a => String(a.residentId) === String(req.user.userId)
    );
    if (idx === -1) throw new AppError("You have not assigned this staff member", StatusCodes.FORBIDDEN);

    staff.assignments.splice(idx, 1);

    if (staff.assignments.length === 0) {
      await Staff.deleteOne({ _id: staff._id });
    } else {
      await staff.save();
    }

    res.json({ message: "Removed successfully" });
  } catch (error) {
    next(error);
  }
}


// ── Guard: Gate Operations ───────────────────────────────────────

/*
  GET /api/staff/search?q=phone_or_name
  Guard searches for a staff member by phone number OR name.
  Used as fallback when QR scan is not available.

  HINT: Use MongoDB $or operator to search both fields.
  Steps:
    1. Get query param: q = sanitizeText(req.query?.q)
    2. If !q → throw BAD_REQUEST
    3. Staff.find({
         tenantId: req.tenantId,
         $or: [
           { phone: { $regex: q, $options: "i" } },  // case-insensitive phone match
           { name:  { $regex: q, $options: "i" } }   // case-insensitive name match
         ]
       })
    4. For each result, attach scheduleStatus to each assignment
    5. Return items
*/
export async function searchStaff(req, res, next) {
  try {
    const q = sanitizeText(req.query?.q);
    if (!q) throw new AppError("Search query is required", StatusCodes.BAD_REQUEST);

    const staffList = await Staff.find({
      tenantId: req.tenantId,
      $or: [
        { phone: { $regex: q, $options: "i" } },
        { name:  { $regex: q, $options: "i" } }
      ]
    }).populate("assignments.residentId", "fullName");

    // Attach scheduleStatus to each assignment so guard sees warnings
    const items = staffList.map(s => ({
      ...s.toObject(),
      assignments: s.assignments.map(a => ({
        ...a.toObject(),
        scheduleStatus: scheduleStatus(a)
      }))
    }));

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

/*
  GET /api/staff/by-code/:staffCode
  Guard scans QR → frontend decodes staffCode → calls this endpoint.
  Returns full staff details + assignment schedule statuses.

  HINT: Simpler than search — exact match on staffCode field.
  Steps:
    1. Staff.findOne({ tenantId: req.tenantId, staffCode: req.params.staffCode })
    2. If not found → throw NOT_FOUND
    3. Attach scheduleStatus to each assignment
    4. Populate assignments.residentId with "fullName"
    5. Return item
*/
export async function getByStaffCode(req, res, next) {
  try {
    const staff = await Staff.findOne({
      tenantId:  req.tenantId,
      staffCode: req.params.staffCode.toUpperCase()
    }).populate("assignments.residentId", "fullName");

    if (!staff) throw new AppError("No staff found with this code", StatusCodes.NOT_FOUND);

    // Attach scheduleStatus to each assignment
    const item = {
      ...staff.toObject(),
      assignments: staff.assignments.map(a => ({
        ...a.toObject(),
        scheduleStatus: scheduleStatus(a)
      }))
    };

    res.json({ item });
  } catch (error) {
    next(error);
  }
}

/*
  GET /api/staff/expected-today
  Guard's dashboard — shows all staff expected today based on their schedules.
  Helps guard know who should arrive and who hasn't shown up yet.

  HINT:
  Steps:
    1. Get today's day name (e.g. "mon") — same as scheduleStatus helper
    2. Find all Staff where tenantId matches AND
       at least one assignment has this day in allowedDays
       AND that assignment is not blocked
       MongoDB: { tenantId, "assignments.allowedDays": currentDay, "assignments.blocked": false }
    3. Also fetch today's StaffEntry records to know who already entered
       StaffEntry.find({ tenantId, entryTime: { $gte: startOfDay } })
    4. For each staff, mark "alreadyIn: true" if they have an entry today
    5. Return the list
*/
export async function expectedToday(req, res, next) {
  try {
    // Step 1: Get today's day name
    const dayNames   = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const currentDay = dayNames[new Date().getDay()];

    // Step 2: Find all staff expected today
    // at least one assignment has today in allowedDays AND is not blocked
    const staffList = await Staff.find({
      tenantId: req.tenantId,
      "assignments.allowedDays": currentDay,
      "assignments.blocked":     false
    }).populate("assignments.residentId", "fullName");

    // Step 3: Fetch today's entries to know who already entered
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayEntries = await StaffEntry.find({
      tenantId:  req.tenantId,
      entryTime: { $gte: startOfDay }
    });

    // Build a Set of staffIds who already entered — fast O(1) lookup
    const enteredIds = new Set(todayEntries.map(e => String(e.staffId)));

    // Step 4: Attach alreadyIn flag to each staff
    const items = staffList.map(s => ({
      ...s.toObject(),
      alreadyIn: enteredIds.has(String(s._id)),
      assignments: s.assignments
        .filter(a => a.allowedDays.includes(currentDay) && !a.blocked)
        .map(a => ({ ...a.toObject(), scheduleStatus: scheduleStatus(a) }))
    }));

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

/*
  POST /api/staff/:id/log-entry
  Guard logs a staff member's entry for a specific flat.
  Body: { flatNumber }

  HINT: Similar to logFreqEntry in freq-visitor.controller.js BUT:
    - Check if assignment is blocked → throw FORBIDDEN
    - Check if assignment is onLeave → throw BAD_REQUEST with clear message
    - Check scheduleStatus → if wrong_day or wrong_time, still allow but add warning in response
    - Create StaffEntry record (not Visitor)
    - Notify resident via socket: SOCKET_EVENTS.STAFF_ENTRY
  Steps:
    1. Find Staff by _id + tenantId, populate assignments.residentId
    2. Find the assignment matching flatNumber
    3. Check blocked → error
    4. Check onLeave → error
    5. Get scheduleStatus → store as warning
    6. StaffEntry.create({ tenantId, staffId, residentId, flatNumber, loggedBy })
    7. Notify resident
    8. Return { entry, warning (if any) }
*/
export async function logStaffEntry(req, res, next) {
  try {
    const flatNumber = sanitizeText(req.body?.flatNumber);
    if (!flatNumber) throw new AppError("flatNumber is required", StatusCodes.BAD_REQUEST);

    // Step 1: Find staff + populate residentId for notification
    const staff = await Staff.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate("assignments.residentId", "fullName");
    if (!staff) throw new AppError("Staff member not found", StatusCodes.NOT_FOUND);

    // Step 2: Find the assignment for this flat
    const assignment = staff.assignments.find(a => a.flatNumber === flatNumber);
    if (!assignment) {
      throw new AppError(`This staff is not assigned to flat ${flatNumber}`, StatusCodes.BAD_REQUEST);
    }

    // Step 3: Check if blocked
    if (assignment.blocked) {
      throw new AppError(
        `${staff.name} has been blocked from flat ${flatNumber}`,
        StatusCodes.FORBIDDEN
      );
    }

    // Step 4: Check if on leave
    if (assignment.onLeave) {
      throw new AppError(
        `${staff.name} is marked on leave today`,
        StatusCodes.BAD_REQUEST
      );
    }

    // Step 5: Check schedule — still allow entry but attach warning
    const status  = scheduleStatus(assignment);
    const warning = status === "wrong_day"  ? `${staff.name} is not scheduled today`
                  : status === "wrong_time" ? `${staff.name} is outside allowed hours (${assignment.allowedFrom}–${assignment.allowedUntil})`
                  : null;

    // Step 6: Create StaffEntry record
    const entry = await StaffEntry.create({
      tenantId:   req.tenantId,
      staffId:    staff._id,
      residentId: assignment.residentId._id,
      flatNumber,
      loggedBy:   req.user.userId
    });

    const populated = await StaffEntry.findById(entry._id)
      .populate("staffId",   "name phone category staffCode photoUrl")
      .populate("loggedBy",  "fullName")
      .populate("residentId","fullName");

    // Step 7: Notify resident in real-time
    await Notification.create({
      tenantId: req.tenantId,
      userId:   assignment.residentId._id,
      type:     "staff_entry",
      title:    `${staff.category} has arrived`,
      message:  `${staff.name} has entered for flat ${flatNumber}.${warning ? " ⚠️ " + warning : ""}`,
      data:     { staffEntryId: entry._id }
    });

    const io = req.app.get("io");
    io.to(`user:${assignment.residentId._id}`).emit(SOCKET_EVENTS.STAFF_ENTRY, {
      entry: populated,
      warning
    });

    // Step 8: Return entry + warning if outside schedule
    res.status(StatusCodes.CREATED).json({ item: populated, warning });
  } catch (error) {
    next(error);
  }
}

/*
  PATCH /api/staff/entries/:entryId/exit
  Guard marks a staff member as exited. MANDATORY before shift end.

  HINT: Simple update — similar to markExit in visitor.controller.js.
  Steps:
    1. StaffEntry.findOne({ _id: req.params.entryId, tenantId: req.tenantId })
    2. If not found → NOT_FOUND
    3. If exitMarked already true → BAD_REQUEST "Already exited"
    4. Set exitTime = new Date(), exitMarked = true, exitLoggedBy = req.user.userId
    5. Save and return
*/
export async function markStaffExit(req, res, next) {
  try {
    const entry = await StaffEntry.findOne({
      _id:      req.params.entryId,
      tenantId: req.tenantId
    });

    if (!entry) throw new AppError("Staff entry record not found", StatusCodes.NOT_FOUND);
    if (entry.exitMarked) throw new AppError("Exit already marked for this entry", StatusCodes.BAD_REQUEST);

    entry.exitTime      = new Date();
    entry.exitMarked    = true;
    entry.exitLoggedBy  = req.user.userId;
    await entry.save();

    const populated = await StaffEntry.findById(entry._id)
      .populate("staffId",  "name phone category staffCode")
      .populate("loggedBy", "fullName")
      .populate("exitLoggedBy", "fullName");

    res.json({ item: populated });
  } catch (error) {
    next(error);
  }
}

/*
  PATCH /api/staff/:id/toggle-leave
  Guard marks a staff member as on leave (or removes leave) for a specific flat.
  Body: { flatNumber }

  HINT:
  Steps:
    1. Find Staff by _id + tenantId
    2. Find the assignment matching flatNumber
    3. Toggle assignment.onLeave (if true → false, if false → true)
    4. Save
    5. Notify resident: "Your [category] is on leave today" or "Back from leave"
    6. Return updated staff
*/
export async function toggleLeave(req, res, next) {
  try {
    const flatNumber = sanitizeText(req.body?.flatNumber);
    if (!flatNumber) throw new AppError("flatNumber is required", StatusCodes.BAD_REQUEST);

    const staff = await Staff.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate("assignments.residentId", "fullName");
    if (!staff) throw new AppError("Staff member not found", StatusCodes.NOT_FOUND);

    const assignment = staff.assignments.find(a => a.flatNumber === flatNumber);
    if (!assignment) {
      throw new AppError(`No assignment found for flat ${flatNumber}`, StatusCodes.NOT_FOUND);
    }

    // Toggle onLeave
    assignment.onLeave = !assignment.onLeave;
    await staff.save();

    // Notify resident — message changes based on new state
    const message = assignment.onLeave
      ? `${staff.name} (${staff.category}) is marked on leave today`
      : `${staff.name} (${staff.category}) leave has been removed`;

    await Notification.create({
      tenantId: req.tenantId,
      userId:   assignment.residentId._id,
      type:     "staff_leave_toggled",
      title:    assignment.onLeave ? "Staff on leave" : "Staff leave removed",
      message,
      data:     { staffId: staff._id }
    });

    const io = req.app.get("io");
    io.to(`user:${assignment.residentId._id}`).emit(SOCKET_EVENTS.STAFF_LEAVE_TOGGLED, {
      staffId:   staff._id,
      staffName: staff.name,
      onLeave:   assignment.onLeave,
      flatNumber
    });

    res.json({ item: staff, onLeave: assignment.onLeave });
  } catch (error) {
    next(error);
  }
}

/*
  PATCH /api/staff/:id/toggle-block
  Resident permanently blocks/unblocks a staff member from their flat.
  Body: { flatNumber }

  HINT: Same pattern as toggleLeave but:
    - Only the resident of that flat can block (check residentId matches req.user.userId)
    - Toggle assignment.blocked
    - Notify committee when a block happens (security concern)
*/
export async function toggleBlock(req, res, next) {
  try {
    const flatNumber = sanitizeText(req.body?.flatNumber);
    if (!flatNumber) throw new AppError("flatNumber is required", StatusCodes.BAD_REQUEST);

    const staff = await Staff.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate("assignments.residentId", "fullName");
    if (!staff) throw new AppError("Staff member not found", StatusCodes.NOT_FOUND);

    const assignment = staff.assignments.find(a => a.flatNumber === flatNumber);
    if (!assignment) {
      throw new AppError(`No assignment found for flat ${flatNumber}`, StatusCodes.NOT_FOUND);
    }

    // Only the resident of this flat can block — security check
    if (String(assignment.residentId._id) !== String(req.user.userId)) {
      throw new AppError("Only the resident of this flat can block staff", StatusCodes.FORBIDDEN);
    }

    // Toggle blocked
    assignment.blocked = !assignment.blocked;
    await staff.save();

    res.json({ item: staff, blocked: assignment.blocked });
  } catch (error) {
    next(error);
  }
}

/*
  GET /api/staff/entries/pending-exits
  Guard sees all staff currently inside (exitMarked: false) for today.
  Used to enforce mandatory exit marking before shift end.

  HINT:
  Steps:
    1. Get start of today (midnight)
    2. StaffEntry.find({
         tenantId: req.tenantId,
         exitMarked: false,
         entryTime: { $gte: startOfDay }
       })
    3. Populate staffId with "name phone category staffCode"
    4. Return items
*/
export async function pendingExits(req, res, next) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const items = await StaffEntry.find({
      tenantId:   req.tenantId,
      exitMarked: false,
      entryTime:  { $gte: startOfDay }
    })
      .populate("staffId",    "name phone category staffCode photoUrl")
      .populate("residentId", "fullName")
      .populate("loggedBy",   "fullName")
      .sort({ entryTime: 1 }); // oldest entry first — they've been inside longest

    res.json({ items });
  } catch (error) {
    next(error);
  }
}
