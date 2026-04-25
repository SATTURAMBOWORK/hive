import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { Poll, Vote } from "../models/poll.model.js";
import { Notification } from "../models/notification.model.js";
import { AppError } from "../utils/app-error.js";
import { SOCKET_EVENTS } from "../config/socket-events.js";
import { emitRealtime } from "../services/realtime-bus.service.js";

// ── Helpers ──────────────────────────────────────────────────────

function sanitize(v) {
  return typeof v === "string" ? v.trim() : "";
}

/*
  isPollOpen — checks BOTH the status field AND the endsAt deadline.
  A poll is closed if:
    - status === "closed"  (manually closed by committee)
    - OR endsAt is set and has passed

  This way, even if we never run a cron job, expired polls are treated
  as closed at query time.
*/
function isPollOpen(poll) {
  if (poll.status === "closed") return false;
  if (poll.endsAt && new Date() > new Date(poll.endsAt)) return false;
  return true;
}

/*
  sanitizedPoll — adds a computed `isOpen` field and hides nothing.
  We send the full options array with vote counts always.
  The frontend decides whether to show the voting UI or results UI
  based on `isOpen` and whether the user has already voted.
*/
function sanitizedPoll(poll, myVote = null) {
  const obj = poll.toObject ? poll.toObject() : poll;
  return {
    ...obj,
    isOpen: isPollOpen(poll),
    myVote: myVote ? myVote.optionIds : null,  // null = hasn't voted yet
  };
}


// ── Committee: Create Poll ────────────────────────────────────────

/*
  POST /api/polls
  Committee creates a new poll and broadcasts it to all residents.

  Body: {
    title, description,
    options: ["Option A", "Option B", ...],   ← array of strings (2–10)
    allowMultiple: false,
    endsAt: "2025-04-20T18:00:00Z"            ← optional ISO date
  }

  Steps:
  1. Sanitize title, description
  2. Parse options array — must be 2–10 non-empty strings
  3. Validate endsAt if provided (must be in the future)
  4. Poll.create(...)
  5. Broadcast POLL_CREATED via socket to the tenant room
  6. Return created poll
*/
export async function createPoll(req, res, next) {
  try {
    const title       = sanitize(req.body?.title);
    const description = sanitize(req.body?.description);
    const rawOptions  = req.body?.options;
    const allowMultiple = Boolean(req.body?.allowMultiple);
    const endsAtRaw   = req.body?.endsAt || null;

    // Validate title
    if (!title) throw new AppError("Poll title is required", StatusCodes.BAD_REQUEST);

    // Parse and validate options
    if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
      throw new AppError("Provide at least 2 options", StatusCodes.BAD_REQUEST);
    }
    if (rawOptions.length > 10) {
      throw new AppError("Maximum 10 options allowed", StatusCodes.BAD_REQUEST);
    }

    const options = rawOptions
      .map(o => ({ text: sanitize(String(o)) }))
      .filter(o => o.text.length > 0);

    if (options.length < 2) {
      throw new AppError("Options cannot be empty strings", StatusCodes.BAD_REQUEST);
    }

    // Validate endsAt — required, must be future, max 7 days from now
    if (!endsAtRaw) throw new AppError("Poll end time is required", StatusCodes.BAD_REQUEST);
    const endsAt = new Date(endsAtRaw);
    if (isNaN(endsAt.getTime())) throw new AppError("endsAt is not a valid date", StatusCodes.BAD_REQUEST);
    if (endsAt <= new Date()) throw new AppError("End time must be in the future", StatusCodes.BAD_REQUEST);
    const maxEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (endsAt > maxEndsAt) throw new AppError("End time cannot be more than 7 days from now", StatusCodes.BAD_REQUEST);

    const poll = await Poll.create({
      tenantId:  req.tenantId,
      createdBy: req.user.userId,
      title,
      description,
      options,
      allowMultiple,
      endsAt,
    });

    const populated = await Poll.findById(poll._id).populate("createdBy", "fullName");

    // Broadcast to entire tenant room so all connected users see the new poll
    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.POLL_CREATED,
      payload: sanitizedPoll(populated)
    });

    res.status(StatusCodes.CREATED).json({ item: sanitizedPoll(populated) });
  } catch (err) {
    next(err);
  }
}


// ── List Polls ────────────────────────────────────────────────────

/*
  GET /api/polls?status=active|closed
  All authenticated members see all polls in their society.
  Also attaches myVote so the frontend knows whether this user voted.

  Query param `status` filters: "active" | "closed" | omit for all.

  Steps:
  1. Build filter: tenantId + optional status
  2. Poll.find(...).sort by newest first
  3. Fetch all this user's votes for these polls in one query (efficient!)
  4. Build a Map of pollId → myVote for O(1) lookup
  5. Return sanitized polls with myVote attached
*/
export async function listPolls(req, res, next) {
  try {
    const { status } = req.query;

    const filter = { tenantId: req.tenantId };
    if (status === "active" || status === "closed") filter.status = status;

    const polls = await Poll.find(filter)
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 });

    // Fetch all this user's votes in ONE query — more efficient than querying per poll
    const pollIds = polls.map(p => p._id);
    const myVotes = await Vote.find({ userId: req.user.userId, pollId: { $in: pollIds } });

    // Build Map for fast lookup: pollId string → Vote document
    const voteMap = new Map(myVotes.map(v => [String(v.pollId), v]));

    const items = polls.map(p => sanitizedPoll(p, voteMap.get(String(p._id)) || null));

    res.json({ items });
  } catch (err) {
    next(err);
  }
}


// ── Get Single Poll ───────────────────────────────────────────────

/*
  GET /api/polls/:id
  Returns a single poll with full option details + this user's vote.
*/
export async function getPoll(req, res, next) {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate("createdBy", "fullName");

    if (!poll) throw new AppError("Poll not found", StatusCodes.NOT_FOUND);

    const myVote = await Vote.findOne({ pollId: poll._id, userId: req.user.userId });

    res.json({ item: sanitizedPoll(poll, myVote) });
  } catch (err) {
    next(err);
  }
}


// ── Cast Vote ─────────────────────────────────────────────────────

/*
  POST /api/polls/:id/vote
  Resident casts their vote.
  Body: { optionIds: ["<optionId>", ...] }

  The KEY pattern here:
  ┌─────────────────────────────────────────────────────────┐
  │  We use TWO atomic operations:                          │
  │  1. Vote.create() — inserts vote record                 │
  │     If duplicate (same user + poll), MongoDB throws     │
  │     error code 11000 → caught → "already voted"        │
  │  2. Poll.updateOne() with $inc — atomically increments  │
  │     vote counts on each selected option                 │
  │     Also $inc totalVotes by 1                          │
  │                                                         │
  │  This is safe even if two users vote simultaneously.    │
  └─────────────────────────────────────────────────────────┘

  Steps:
  1. Find poll — must be open
  2. Parse optionIds from body
  3. Validate: optionIds must belong to this poll's options
  4. Single choice: if !allowMultiple, optionIds.length must be 1
  5. Vote.create({ tenantId, pollId, userId, optionIds })
     → duplicate throws 11000 → "already voted"
  6. Build MongoDB $inc update for each chosen option
  7. Poll.updateOne with $inc on votes + totalVotes
  8. Fetch updated poll, broadcast POLL_UPDATED via socket
  9. Return updated poll
*/
export async function castVote(req, res, next) {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!poll) throw new AppError("Poll not found", StatusCodes.NOT_FOUND);
    if (!isPollOpen(poll)) throw new AppError("This poll is closed", StatusCodes.BAD_REQUEST);

    // Parse optionIds — accept both array and single string
    let optionIds = req.body?.optionIds;
    if (!Array.isArray(optionIds)) optionIds = optionIds ? [optionIds] : [];

    if (optionIds.length === 0) throw new AppError("Select at least one option", StatusCodes.BAD_REQUEST);

    if (!poll.allowMultiple && optionIds.length > 1) {
      throw new AppError("This poll only allows one choice", StatusCodes.BAD_REQUEST);
    }

    // Validate all chosen optionIds belong to this poll
    const validIds = new Set(poll.options.map(o => String(o._id)));
    const invalid  = optionIds.filter(id => !validIds.has(String(id)));
    if (invalid.length) {
      throw new AppError("One or more invalid option IDs", StatusCodes.BAD_REQUEST);
    }

    // Convert to ObjectIds
    const optionObjectIds = optionIds.map(id => new mongoose.Types.ObjectId(id));

    // Step 5: Create vote record — duplicate throws 11000
    await Vote.create({
      tenantId:  req.tenantId,
      pollId:    poll._id,
      userId:    req.user.userId,
      optionIds: optionObjectIds,
    });

    // Step 6: Build $inc for each chosen option
    // MongoDB dot notation for array element by _id:
    //   "options.$[elem].votes": 1  with arrayFilters: [{ "elem._id": optionId }]
    // OR simpler: update each option one by one (fine for 2–10 options)
    const incUpdate = {};
    optionIds.forEach(id => {
      // Find the array index of this option
      const idx = poll.options.findIndex(o => String(o._id) === String(id));
      if (idx >= 0) incUpdate[`options.${idx}.votes`] = 1;
    });
    incUpdate.totalVotes = 1;

    // Step 7: Atomic increment — safe under concurrent votes
    await Poll.updateOne({ _id: poll._id }, { $inc: incUpdate });

    // Step 8: Fetch fresh poll and broadcast
    const updated = await Poll.findById(poll._id).populate("createdBy", "fullName");
    const myVote  = await Vote.findOne({ pollId: poll._id, userId: req.user.userId });

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.POLL_UPDATED,
      payload: sanitizedPoll(updated)
    });

    res.json({ item: sanitizedPoll(updated, myVote) });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError("You have already voted on this poll", StatusCodes.CONFLICT));
    }
    next(err);
  }
}


// ── Close Poll ────────────────────────────────────────────────────

/*
  PATCH /api/polls/:id/close
  Committee manually closes a poll before its deadline.
*/
export async function closePoll(req, res, next) {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!poll) throw new AppError("Poll not found", StatusCodes.NOT_FOUND);
    if (poll.status === "closed") throw new AppError("Poll is already closed", StatusCodes.BAD_REQUEST);

    poll.status = "closed";
    await poll.save();

    const populated = await Poll.findById(poll._id).populate("createdBy", "fullName");

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.POLL_UPDATED,
      payload: sanitizedPoll(populated)
    });

    res.json({ item: sanitizedPoll(populated) });
  } catch (err) {
    next(err);
  }
}


// ── Delete Poll ───────────────────────────────────────────────────

/*
  DELETE /api/polls/:id
  Committee deletes a poll and all its votes.
  We also delete all Vote documents for this poll (cleanup).
*/
export async function deletePoll(req, res, next) {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!poll) throw new AppError("Poll not found", StatusCodes.NOT_FOUND);

    await Vote.deleteMany({ pollId: poll._id });
    await Poll.deleteOne({ _id: poll._id });

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: SOCKET_EVENTS.POLL_DELETED,
      payload: { pollId: req.params.id }
    });

    res.json({ message: "Poll deleted" });
  } catch (err) {
    next(err);
  }
}
