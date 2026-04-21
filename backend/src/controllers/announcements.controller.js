import { StatusCodes } from "http-status-codes";
import sanitizeHtml from "sanitize-html";
import { Announcement } from "../models/announcement.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";
import { emitRealtime } from "../services/realtime-bus.service.js";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

const ALLOWED_CATEGORIES = new Set(["General", "Maintenance", "Finance", "Emergency", "Event", "Social"]);

function toPositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function sanitizeAnnouncementBody(value) {
  const raw = typeof value === "string" ? value : "";
  const clean = sanitizeHtml(raw, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a"],
    allowedAttributes: {
      a: ["href", "target", "rel"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" })
    }
  });
  const plain = sanitizeHtml(clean, { allowedTags: [], allowedAttributes: {} }).trim();
  return { clean, plain };
}

export async function listAnnouncements(req, res, next) {
  try {
    const page = toPositiveInt(req.query?.page, 1);
    const limit = Math.min(toPositiveInt(req.query?.limit, 15), 50);
    const search = sanitizeText(req.query?.q);
    const category = sanitizeText(req.query?.category);

    const filter = { tenantId: req.tenantId };
    if (category && category !== "All") {
      filter.category = category;
    }
    if (search) {
      filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }

    const [itemsRaw, total] = await Promise.all([
      Announcement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "fullName role")
      .lean(),
      Announcement.countDocuments(filter)
    ]);

    const userId = String(req.user.userId);
    const items = itemsRaw.map((item) => ({
      ...item,
      unread: !(item.readBy || []).some((id) => String(id) === userId)
    }));

    res.json({
      items,
      page,
      limit,
      total,
      hasMore: page * limit < total
    });
  } catch (error) {
    next(error);
  }
}

export async function createAnnouncement(req, res, next) {
  try {
    const title = sanitizeText(req.body?.title);
    const { clean: body, plain: plainBody } = sanitizeAnnouncementBody(req.body?.body);
    const category = sanitizeText(req.body?.category) || "General";

    if (!title || !plainBody) {
      throw new AppError("title and body are required", StatusCodes.BAD_REQUEST);
    }
    if (!ALLOWED_CATEGORIES.has(category)) {
      throw new AppError("Invalid category", StatusCodes.BAD_REQUEST);
    }

    const announcement = await Announcement.create({
      tenantId: req.tenantId,
      title,
      body,
      category,
      readBy: [req.user.userId],
      createdBy: req.user.userId
    });

    const populated = await Announcement.findById(announcement._id)
      .populate("createdBy", "fullName role")
      .lean();

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.ANNOUNCEMENT_CREATED,
      payload: {
        item: {
          ...populated,
          unread: false
        }
      }
    });

    res.status(StatusCodes.CREATED).json({
      item: {
        ...populated,
        unread: false
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function markAnnouncementRead(req, res, next) {
  try {
    const item = await Announcement.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenantId,
        readBy: { $ne: req.user.userId }
      },
      {
        $addToSet: { readBy: req.user.userId }
      },
      {
        new: true
      }
    ).lean();

    if (!item) {
      const exists = await Announcement.exists({ _id: req.params.id, tenantId: req.tenantId });
      if (!exists) {
        throw new AppError("Announcement not found", StatusCodes.NOT_FOUND);
      }
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
