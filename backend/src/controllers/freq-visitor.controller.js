import { StatusCodes } from "http-status-codes";
import { FrequentVisitor, DAYS, TIME_REGEX } from "../models/freq-visitor.model.js";
import { Visitor } from "../models/visitor.model.js";
import { Membership } from "../models/membership.model.js";
import { SocietyWing } from "../models/society-wing.model.js";
import { SocietyUnit } from "../models/society-unit.model.js";
import { Notification } from "../models/notification.model.js";
import { AppError } from "../utils/app-error.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";
import { emitRealtime } from "../services/realtime-bus.service.js";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Check whether right now falls inside a link's allowed days + time window
// Returns: "ok" | "wrong_day" | "wrong_time"
function scheduleStatus(link) {
  const now        = new Date();
  const dayNames   = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const currentDay = dayNames[now.getDay()];
  const hh         = String(now.getHours()).padStart(2, "0");
  const mm         = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${hh}:${mm}`;

  if (link.allowedDays.length > 0 && !link.allowedDays.includes(currentDay)) {
    return "wrong_day";
  }
  if (currentTime < link.allowedFrom || currentTime > link.allowedUntil) {
    return "wrong_time";
  }
  return "ok";
}

// Lookup the resident's flat number from their membership
async function getFlatForResident(tenantId, residentId) {
  const membership = await Membership.findOne({
    tenantId,
    userId: residentId,
    status: "approved"
  })
    .populate("wingId", "name")
    .populate("unitId", "unitNumber");

  if (!membership?.wingId || !membership?.unitId) return null;
  return `${membership.wingId.name}-${membership.unitId.unitNumber}`;
}

// ─────────────────────────────────────────────────────────────────
// POST /api/freq-visitors
// Resident adds a frequent visitor.
//   • If phone doesn't exist yet in this tenant → create new document.
//   • If phone already exists → add/update this resident's link.
//   • Photo (optional file upload) only updates photoUrl when provided.
// ─────────────────────────────────────────────────────────────────
export async function addOrLinkFreqVisitor(req, res, next) {
  try {
    const name         = sanitizeText(req.body?.name);
    const phone        = sanitizeText(req.body?.phone).replace(/\D/g, ""); // digits only
    const relationship = sanitizeText(req.body?.relationship) || "other";
    const description  = sanitizeText(req.body?.description);

    // allowedDays comes as a JSON string from FormData e.g. '["mon","tue"]'
    let allowedDays = [];
    try {
      allowedDays = JSON.parse(req.body?.allowedDays || "[]");
    } catch {
      allowedDays = [];
    }

    const allowedFrom  = sanitizeText(req.body?.allowedFrom)  || "00:00";
    const allowedUntil = sanitizeText(req.body?.allowedUntil) || "23:59";

    // Validate
    if (!phone) throw new AppError("phone is required", StatusCodes.BAD_REQUEST);
    if (!TIME_REGEX.test(allowedFrom))  throw new AppError("allowedFrom must be HH:MM", StatusCodes.BAD_REQUEST);
    if (!TIME_REGEX.test(allowedUntil)) throw new AppError("allowedUntil must be HH:MM", StatusCodes.BAD_REQUEST);
    if (allowedUntil <= allowedFrom)    throw new AppError("allowedUntil must be after allowedFrom", StatusCodes.BAD_REQUEST);

    const invalidDays = allowedDays.filter(d => !DAYS.includes(d));
    if (invalidDays.length) {
      throw new AppError(`Invalid days: ${invalidDays.join(", ")}. Use: ${DAYS.join(", ")}`, StatusCodes.BAD_REQUEST);
    }

    // Get the resident's flat number to store in the link
    const flatNumber = await getFlatForResident(req.tenantId, req.user.userId);
    if (!flatNumber) {
      throw new AppError("Your membership is not approved yet", StatusCodes.FORBIDDEN);
    }

    // Upload photo to Cloudinary if provided
    let photoUrl;
    if (req.file) {
      photoUrl = await uploadToCloudinary(req.file.buffer, { folder: "freq-visitors" });
    }

    // Check if this phone already exists in the tenant
    let freqVisitor = await FrequentVisitor.findOne({ tenantId: req.tenantId, phone });

    if (!freqVisitor) {
      // First time this person is being added — name is required
      if (!name) throw new AppError("name is required when adding a new frequent visitor", StatusCodes.BAD_REQUEST);

      freqVisitor = await FrequentVisitor.create({
        tenantId:     req.tenantId,
        name,
        phone,
        photoUrl:     photoUrl || "",
        relationship,
        description,
        links: [{
          residentId:   req.user.userId,
          flatNumber,
          allowedDays,
          allowedFrom,
          allowedUntil
        }]
      });
    } else {
      // Person already in the system — add or update this resident's link
      const existingLinkIdx = freqVisitor.links.findIndex(
        l => String(l.residentId) === String(req.user.userId)
      );

      const linkData = { residentId: req.user.userId, flatNumber, allowedDays, allowedFrom, allowedUntil };

      if (existingLinkIdx >= 0) {
        // Update existing link
        freqVisitor.links[existingLinkIdx] = { ...freqVisitor.links[existingLinkIdx], ...linkData };
      } else {
        // Add new link
        freqVisitor.links.push(linkData);
      }

      // Update shared fields only if provided
      if (name)        freqVisitor.name        = name;
      if (relationship) freqVisitor.relationship = relationship;
      if (description)  freqVisitor.description  = description;
      if (photoUrl)     freqVisitor.photoUrl      = photoUrl;

      await freqVisitor.save();
    }

    const populated = await FrequentVisitor.findById(freqVisitor._id)
      .populate("links.residentId", "fullName");

    res.status(StatusCodes.CREATED).json({ item: populated });
  } catch (error) {
    // Handle unique index violation (race condition — two residents add same phone simultaneously)
    if (error.code === 11000) {
      return next(new AppError("A frequent visitor with this phone already exists. Try again.", StatusCodes.CONFLICT));
    }
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/freq-visitors/mine
// Resident lists all frequent visitors they have linked.
// ─────────────────────────────────────────────────────────────────
export async function listMyFreqVisitors(req, res, next) {
  try {
    // Find all documents where this resident has a link
    const items = await FrequentVisitor.find({
      tenantId: req.tenantId,
      "links.residentId": req.user.userId
    }).sort({ name: 1 });

    // For each document, expose only this resident's link (not other residents' schedules)
    const sanitized = items.map(fv => ({
      _id:          fv._id,
      name:         fv.name,
      phone:        fv.phone,
      photoUrl:     fv.photoUrl,
      relationship: fv.relationship,
      description:  fv.description,
      myLink:       fv.links.find(l => String(l.residentId) === String(req.user.userId))
    }));

    res.json({ items: sanitized });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH /api/freq-visitors/:id/my-link
// Resident updates their own schedule for this frequent visitor.
// ─────────────────────────────────────────────────────────────────
export async function updateMyLink(req, res, next) {
  try {
    let allowedDays = [];
    try { allowedDays = JSON.parse(req.body?.allowedDays || "[]"); } catch { allowedDays = []; }

    const allowedFrom  = sanitizeText(req.body?.allowedFrom);
    const allowedUntil = sanitizeText(req.body?.allowedUntil);

    if (allowedFrom && !TIME_REGEX.test(allowedFrom)) {
      throw new AppError("allowedFrom must be HH:MM", StatusCodes.BAD_REQUEST);
    }
    if (allowedUntil && !TIME_REGEX.test(allowedUntil)) {
      throw new AppError("allowedUntil must be HH:MM", StatusCodes.BAD_REQUEST);
    }

    const freqVisitor = await FrequentVisitor.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!freqVisitor) throw new AppError("Frequent visitor not found", StatusCodes.NOT_FOUND);

    const linkIdx = freqVisitor.links.findIndex(
      l => String(l.residentId) === String(req.user.userId)
    );
    if (linkIdx === -1) throw new AppError("You have not linked this frequent visitor", StatusCodes.FORBIDDEN);

    if (allowedDays.length)   freqVisitor.links[linkIdx].allowedDays  = allowedDays;
    if (allowedFrom)          freqVisitor.links[linkIdx].allowedFrom   = allowedFrom;
    if (allowedUntil)         freqVisitor.links[linkIdx].allowedUntil  = allowedUntil;

    await freqVisitor.save();

    res.json({ item: freqVisitor });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /api/freq-visitors/:id/my-link
// Resident removes their link from this frequent visitor.
// If no links remain after removal, the whole document is deleted.
// ─────────────────────────────────────────────────────────────────
export async function removeMyLink(req, res, next) {
  try {
    const freqVisitor = await FrequentVisitor.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!freqVisitor) throw new AppError("Frequent visitor not found", StatusCodes.NOT_FOUND);

    const before = freqVisitor.links.length;
    freqVisitor.links = freqVisitor.links.filter(
      l => String(l.residentId) !== String(req.user.userId)
    );

    if (freqVisitor.links.length === before) {
      throw new AppError("You have not linked this frequent visitor", StatusCodes.FORBIDDEN);
    }

    if (freqVisitor.links.length === 0) {
      // No residents left — remove the entire record
      await FrequentVisitor.deleteOne({ _id: freqVisitor._id });
    } else {
      await freqVisitor.save();
    }

    res.json({ message: "Removed successfully" });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/freq-visitors/search?phone=9876543210
// Guard searches by phone number.
// Returns the visitor details + all linked flats with schedule status.
// ─────────────────────────────────────────────────────────────────
export async function searchByPhone(req, res, next) {
  try {
    const phone = sanitizeText(req.query?.phone).replace(/\D/g, "");
    if (!phone) throw new AppError("phone query param is required", StatusCodes.BAD_REQUEST);

    const freqVisitor = await FrequentVisitor.findOne({ tenantId: req.tenantId, phone })
      .populate("links.residentId", "fullName phone");

    if (!freqVisitor) {
      throw new AppError(
        "No frequent visitor found with this phone number in your society.",
        StatusCodes.NOT_FOUND
      );
    }

    // Attach a schedule status to each link so the guard UI can show warnings
    const linksWithStatus = freqVisitor.links.map(link => ({
      residentId:   link.residentId,
      flatNumber:   link.flatNumber,
      allowedDays:  link.allowedDays,
      allowedFrom:  link.allowedFrom,
      allowedUntil: link.allowedUntil,
      scheduleStatus: scheduleStatus(link) // "ok" | "wrong_day" | "wrong_time"
    }));

    res.json({
      item: {
        _id:          freqVisitor._id,
        name:         freqVisitor.name,
        phone:        freqVisitor.phone,
        photoUrl:     freqVisitor.photoUrl,
        relationship: freqVisitor.relationship,
        description:  freqVisitor.description,
        links:        linksWithStatus
      }
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/freq-visitors/:id/log-entry
// Guard logs entry for a specific linked flat.
// Creates an auto-approved Visitor record and notifies the resident.
// Body: { flatNumber }
// ─────────────────────────────────────────────────────────────────
export async function logFreqEntry(req, res, next) {
  try {
    const flatNumber = sanitizeText(req.body?.flatNumber);
    if (!flatNumber) throw new AppError("flatNumber is required", StatusCodes.BAD_REQUEST);

    const freqVisitor = await FrequentVisitor.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate("links.residentId", "fullName");

    if (!freqVisitor) throw new AppError("Frequent visitor not found", StatusCodes.NOT_FOUND);

    const link = freqVisitor.links.find(l => l.flatNumber === flatNumber);
    if (!link) {
      throw new AppError(`This visitor is not linked to flat ${flatNumber}`, StatusCodes.BAD_REQUEST);
    }

    // Create the Visitor log entry (auto-approved — resident already trusts this person)
    const visitor = await Visitor.create({
      tenantId:       req.tenantId,
      visitorName:    freqVisitor.name,
      visitorPhone:   freqVisitor.phone,
      flatNumber,
      residentName:   link.residentId.fullName,
      purpose:        "guest",
      vehicleNumber:  "",
      residentId:     link.residentId._id,
      approvalStatus: "approved",
      status:         "inside",
      loggedBy:       req.user.userId
    });

    const populated = await Visitor.findById(visitor._id)
      .populate("loggedBy",   "fullName")
      .populate("residentId", "fullName");

    // Notify the resident in real-time
    await Notification.create({
      tenantId: req.tenantId,
      userId:   link.residentId._id,
      type:     "freq_visitor_entry",
      title:    "Frequent visitor entered",
      message:  `${freqVisitor.name} (${freqVisitor.relationship}) has entered your building.`,
      data:     { visitorId: visitor._id }
    });

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `user:${link.residentId._id}`,
      event: SOCKET_EVENTS.FREQ_VISITOR_ENTRY,
      payload: {
        visitor:     populated,
        freqVisitor: { name: freqVisitor.name, relationship: freqVisitor.relationship, photoUrl: freqVisitor.photoUrl }
      }
    });

    res.status(StatusCodes.CREATED).json({ item: populated });
  } catch (error) {
    next(error);
  }
}
