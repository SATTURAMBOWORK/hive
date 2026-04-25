import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { LostFound } from "../models/lost-found.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";
import { emitRealtime } from "../services/realtime-bus.service.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

/*
  📖 LEARNING NOTE — What is a Controller?
  -----------------------------------------
  Controllers are the functions that run when a specific API route is hit.
  Each function follows the same pattern:
    1. Read data from req.body / req.params / req.query
    2. Validate it (throw AppError if something is wrong)
    3. Talk to the database (create / find / update / delete)
    4. Send a response back with res.json(...)
    5. If anything goes wrong, pass the error to next(error)
       so the global error handler in error.middleware.js handles it.

  req  = the incoming HTTP request
  res  = the outgoing HTTP response
  next = call next(error) to skip to the error handler
*/

// ─── Helper ───────────────────────────────────────────────────────────────────
function sanitize(val) {
  // Trims whitespace from strings; returns "" for non-strings.
  // Always sanitize user input before saving to DB.
  return typeof val === "string" ? val.trim() : "";
}

// ─── 1. LIST all posts for this society ───────────────────────────────────────
/*
  📖 LEARNING NOTE — GET /api/lost-found
  ----------------------------------------
  .find({ tenantId }) → fetch only posts belonging to this society
  .sort({ createdAt: -1 }) → newest post first (-1 = descending)
  .populate("postedBy", "fullName") → instead of just a user ID,
    attach the user's fullName so the frontend can show "Posted by Rahul"
  .populate("claimedBy", "fullName") → same for the claimer
*/
export async function listItems(req, res, next) {
  try {
    const items = await LostFound.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .populate("postedBy",  "fullName")
      .populate("claimedBy", "fullName");

    res.json({ items });
  } catch (error) {
    next(error);
  }
}

// ─── 2. CREATE a new post ──────────────────────────────────────────────────────
/*
  📖 LEARNING NOTE — POST /api/lost-found
  -----------------------------------------
  We read from req.body (the JSON the frontend sent).
  We validate required fields manually and throw AppError if invalid.
  AppError(message, statusCode) → the error middleware turns this into a
    proper HTTP error response with the right status code.

  After saving, we emit a real-time socket event so everyone
  online sees the new post without refreshing the page.

  req.tenantId  → set by the tenant middleware (which society)
  req.user.userId → set by the auth middleware (who is posting)
*/
export async function createItem(req, res, next) {
  try {
    // 1. Read and sanitize input
    const type        = sanitize(req.body?.type);
    const category    = sanitize(req.body?.category) || "other";
    const title       = sanitize(req.body?.title);
    const description = sanitize(req.body?.description);
    const location    = sanitize(req.body?.location);
    const date        = req.body?.date;

    // 2. Validate required fields
    if (!["lost", "found"].includes(type)) {
      throw new AppError("type must be 'lost' or 'found'", StatusCodes.BAD_REQUEST);
    }
    if (!title || !description) {
      throw new AppError("title and description are required", StatusCodes.BAD_REQUEST);
    }
    if (!date) {
      throw new AppError("date is required", StatusCodes.BAD_REQUEST);
    }

    // 3. Upload photo to Cloudinary if one was attached
    //    req.file is set by the multer middleware on the route
    let photo = "";
    if (req.file) {
      photo = await uploadToCloudinary(req.file.buffer, { folder: "lost-found" });
    }

    // 4. Save to MongoDB
    const item = await LostFound.create({
      tenantId:    req.tenantId,
      type,
      category,
      title,
      description,
      location,
      photo,
      date:        new Date(date),
      postedBy:    req.user.userId,
    });

    // 5. Emit socket event so all online users see it immediately
    //    req.app.get("io") retrieves the Socket.io instance set in server.js
    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.LOST_FOUND_CREATED,
      payload: { item }
    });

    // 6. Respond with the newly created document
    res.status(StatusCodes.CREATED).json({ item });
  } catch (error) {
    next(error);
  }
}

// ─── 3. CLAIM an item ─────────────────────────────────────────────────────────
/*
  📖 LEARNING NOTE — PATCH /api/lost-found/:id/claim
  ----------------------------------------------------
  PATCH is used for partial updates (we only change claimedBy, not the whole document).

  Flow:
    - Find the post by _id AND tenantId (security: can't claim another society's post)
    - Make sure the post is still active (not already resolved)
    - Make sure the poster isn't claiming their own post
    - Set claimedBy = the requesting user
    - Save and emit a socket event

  mongoose.Types.ObjectId.isValid() → checks if a string is a valid MongoDB ObjectId
    (prevents crashing when someone sends garbage like "/api/lost-found/abc/claim")
*/
export async function claimItem(req, res, next) {
  try {
    const { id } = req.params;

    // Validate the ID shape before hitting the DB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid item id", StatusCodes.BAD_REQUEST);
    }

    // Find the post (scoped to this society only)
    const item = await LostFound.findOne({ _id: id, tenantId: req.tenantId });
    if (!item) throw new AppError("Item not found", StatusCodes.NOT_FOUND);

    // Business rules
    if (item.status === "resolved") {
      throw new AppError("This item is already resolved", StatusCodes.CONFLICT);
    }
    if (item.postedBy.toString() === req.user.userId) {
      throw new AppError("You cannot claim your own post", StatusCodes.BAD_REQUEST);
    }

    // Update
    item.claimedBy = req.user.userId;
    await item.save();

    // Populate so the response includes names, not just IDs
    await item.populate("postedBy",  "fullName");
    await item.populate("claimedBy", "fullName");

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.LOST_FOUND_CLAIMED,
      payload: { item }
    });

    res.json({ item });
  } catch (error) {
    next(error);
  }
}

// ─── 4. RESOLVE an item (poster only) ─────────────────────────────────────────
/*
  📖 LEARNING NOTE — PATCH /api/lost-found/:id/resolve
  ------------------------------------------------------
  Only the person who posted the item should be able to mark it as resolved.
  We check:  item.postedBy.toString() === req.user.userId

  .toString() is needed because postedBy is a MongoDB ObjectId object,
  and req.user.userId is a plain string — comparing objects directly
  with === would always be false even if the IDs match.
*/
export async function resolveItem(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid item id", StatusCodes.BAD_REQUEST);
    }

    const item = await LostFound.findOne({ _id: id, tenantId: req.tenantId });
    if (!item) throw new AppError("Item not found", StatusCodes.NOT_FOUND);

    // Only the original poster can resolve the post
    if (item.postedBy.toString() !== req.user.userId) {
      throw new AppError("Only the poster can resolve this item", StatusCodes.FORBIDDEN);
    }

    item.status = "resolved";
    await item.save();

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.LOST_FOUND_RESOLVED,
      payload: { item }
    });

    res.json({ item });
  } catch (error) {
    next(error);
  }
}

// ─── 5. DELETE a post (poster or admin only) ──────────────────────────────────
/*
  📖 LEARNING NOTE — DELETE /api/lost-found/:id
  -----------------------------------------------
  We allow deletion only if:
    a) The user is the original poster, OR
    b) The user is a committee member / super_admin

  req.user.role → set by the auth middleware from the JWT token

  .deleteOne() removes the document from MongoDB permanently.
  We respond with 204 No Content (success, nothing to return).
*/
export async function deleteItem(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid item id", StatusCodes.BAD_REQUEST);
    }

    const item = await LostFound.findOne({ _id: id, tenantId: req.tenantId });
    if (!item) throw new AppError("Item not found", StatusCodes.NOT_FOUND);

    const isOwner = item.postedBy.toString() === req.user.userId;
    const isAdmin = ["committee", "super_admin"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      throw new AppError("Not authorised to delete this post", StatusCodes.FORBIDDEN);
    }

    await item.deleteOne();

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
}
