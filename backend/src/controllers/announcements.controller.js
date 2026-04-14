import { StatusCodes } from "http-status-codes";
import { Announcement } from "../models/announcement.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";
import { cache, cacheKey } from "../config/cache.js";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listAnnouncements(req, res, next) {
  try {
    const key = cacheKey("announcements", req.tenantId);

    // Try the cache first — if data is there, skip the DB entirely
    const cached = cache.get(key);
    if (cached) {
      return res.json({ items: cached });
    }

    // Cache miss — query MongoDB, then store result for 60s
    const announcements = await Announcement.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName role")
      .lean(); // .lean() returns plain JS objects instead of Mongoose documents
               // ~3-5x faster for read-only list responses

    cache.set(key, announcements);
    res.json({ items: announcements });
  } catch (error) {
    next(error);
  }
}

export async function createAnnouncement(req, res, next) {
  try {
    const title = sanitizeText(req.body?.title);
    const body = sanitizeText(req.body?.body);

    if (!title || !body) {
      throw new AppError("title and body are required", StatusCodes.BAD_REQUEST);
    }

    const announcement = await Announcement.create({
      tenantId: req.tenantId,
      title,
      body,
      createdBy: req.user.userId
    });

    // Data changed — invalidate the cache so next read is fresh
    cache.del(cacheKey("announcements", req.tenantId));

    const io = req.app.get("io");
    io.to(`tenant:${req.tenantId}`).emit(SOCKET_EVENTS.ANNOUNCEMENT_CREATED, {
      item: announcement
    });

    res.status(StatusCodes.CREATED).json({ item: announcement });
  } catch (error) {
    next(error);
  }
}
