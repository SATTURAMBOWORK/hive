import { SosAlert } from "../models/sos-alert.model.js";
import { Membership } from "../models/membership.model.js";
import { AppError } from "../utils/app-error.js";
import { StatusCodes } from "http-status-codes";
import { emitRealtime } from "../services/realtime-bus.service.js";

// POST /sos — resident sends an SOS alert
export async function sendSos(req, res, next) {
  try {
    const { userId } = req.user;
    const { message = "" } = req.body;

    // Look up the resident's approved membership to get their exact unit + wing
    const membership = await Membership.findOne({
      userId,
      tenantId: req.tenantId,
      status: "approved",
    })
      .populate("unitId", "unitNumber")
      .populate("wingId", "name");

    const unit = membership?.unitId?.unitNumber || req.user.flatNumber || "";
    const wing = membership?.wingId?.name || "";

    if (!unit) {
      throw new AppError(
        "Your flat number is not set. Please complete your profile before sending an SOS.",
        StatusCodes.BAD_REQUEST
      );
    }

    const created = await SosAlert.create({
      tenantId:   req.tenantId,
      residentId: userId,
      unit,
      wing,
      message,
    });

    // Populate before emitting so guards see resident name immediately (no reload needed)
    const alert = await SosAlert.findById(created._id)
      .populate("residentId", "fullName flatNumber");

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: "sos:alert",
      payload: { alert },
    });

    res.status(StatusCodes.CREATED).json({ alert });
  } catch (error) {
    next(error);
  }
}

// GET /sos — security/committee fetches all alerts for their society
export async function getAlerts(req, res, next) {
  try {
    const alerts = await SosAlert.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 })
      .populate("residentId", "fullName flatNumber")
      .populate("acknowledgedBy", "fullName")
      .populate("resolutionRequestedBy", "fullName")
      .populate("resolvedBy", "fullName");

    res.json({ alerts });
  } catch (error) {
    next(error);
  }
}

// PATCH /sos/:id/acknowledge — security guard marks alert as seen
export async function acknowledgeAlert(req, res, next) {
  try {
    const alert = await SosAlert.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!alert) {
      throw new AppError("Alert not found", StatusCodes.NOT_FOUND);
    }

    if (alert.status !== "sent") {
      throw new AppError("Alert is already acknowledged", StatusCodes.BAD_REQUEST);
    }

    alert.status         = "acknowledged";
    alert.acknowledgedBy = req.user.userId;
    alert.acknowledgedAt = new Date();
    await alert.save();

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: "sos:acknowledged",
      payload: { alertId: alert._id },
    });

    res.json({ alert });
  } catch (error) {
    next(error);
  }
}

// PATCH /sos/:id/resolve — security guard marks situation as handled
export async function resolveAlert(req, res, next) {
  try {
    const alert = await SosAlert.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!alert) {
      throw new AppError("Alert not found", StatusCodes.NOT_FOUND);
    }

    if (alert.status === "resolved") {
      throw new AppError("Alert is already resolved", StatusCodes.BAD_REQUEST);
    }

    if (alert.status === "pending_user_confirmation") {
      throw new AppError(
        "Resolution already requested. Waiting for resident confirmation.",
        StatusCodes.BAD_REQUEST
      );
    }

    if (alert.status !== "acknowledged") {
      throw new AppError("Alert must be acknowledged before resolve", StatusCodes.BAD_REQUEST);
    }

    const io = req.app.get("io");

    // super_admin can force resolve directly without resident confirmation.
    if (req.user.role === "super_admin") {
      alert.status = "resolved";
      alert.resolvedBy = req.user.userId;
      alert.resolvedAt = new Date();
      await alert.save();

      await emitRealtime(io, {
        room: `tenant:${req.tenantId}`,
        event: "sos:resolved",
        payload: {
          alertId: alert._id,
          resolvedBy: req.user.userId,
          requiresResidentConfirmation: false,
        },
      });

      await emitRealtime(io, {
        room: `user:${alert.residentId.toString()}`,
        event: "sos:resolved",
        payload: {
          alertId: alert._id,
          resolvedBy: req.user.userId,
          requiresResidentConfirmation: false,
        },
      });

      return res.json({ alert });
    }

    // security/committee request resolution; resident must confirm.
    alert.status = "pending_user_confirmation";
    alert.resolutionRequestedBy = req.user.userId;
    alert.resolutionRequestedAt = new Date();
    await alert.save();

    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: "sos:resolution_requested",
      payload: {
        alertId: alert._id,
        requestedBy: req.user.userId,
        residentId: alert.residentId,
      },
    });

    await emitRealtime(io, {
      room: `user:${alert.residentId.toString()}`,
      event: "sos:resolution_requested",
      payload: {
        alertId: alert._id,
        requestedBy: req.user.userId,
      },
    });

    return res.json({
      alert,
      message: "Resolution request sent to resident. Final resolve pending resident confirmation.",
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /sos/:id/reject-resolve — resident says they still need help, reverts to acknowledged
export async function rejectResolveAlert(req, res, next) {
  try {
    const alert = await SosAlert.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!alert) {
      throw new AppError("Alert not found", StatusCodes.NOT_FOUND);
    }

    if (alert.residentId.toString() !== req.user.userId) {
      throw new AppError("Only the resident who created this alert can reject resolution", StatusCodes.FORBIDDEN);
    }

    if (alert.status !== "pending_user_confirmation") {
      throw new AppError("This alert is not awaiting confirmation", StatusCodes.BAD_REQUEST);
    }

    // Revert to sent — resident said no help arrived, guard must re-acknowledge
    alert.status               = "sent";
    alert.acknowledgedBy       = undefined;
    alert.acknowledgedAt       = undefined;
    alert.resolutionRequestedBy = undefined;
    alert.resolutionRequestedAt = undefined;
    await alert.save();

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: "sos:resolve_rejected",
      payload: { alertId: alert._id },
    });

    res.json({ alert });
  } catch (error) {
    next(error);
  }
}

// PATCH /sos/:id/confirm-resolve — creator confirms and closes alert
export async function confirmResolveAlert(req, res, next) {
  try {
    const alert = await SosAlert.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!alert) {
      throw new AppError("Alert not found", StatusCodes.NOT_FOUND);
    }

    if (alert.residentId.toString() !== req.user.userId) {
      throw new AppError("Only the resident who created this alert can confirm resolution", StatusCodes.FORBIDDEN);
    }

    if (alert.status === "resolved") {
      throw new AppError("Alert is already resolved", StatusCodes.BAD_REQUEST);
    }

    if (alert.status !== "pending_user_confirmation") {
      throw new AppError("This alert is not awaiting resident confirmation", StatusCodes.BAD_REQUEST);
    }

    alert.status = "resolved";
    alert.resolutionConfirmedByResidentAt = new Date();
    alert.resolvedBy = alert.resolutionRequestedBy || req.user.userId;
    alert.resolvedAt = new Date();
    await alert.save();

    const io = req.app.get("io");
    await emitRealtime(io, {
      room: `tenant:${req.tenantId}`,
      event: "sos:resolved",
      payload: {
        alertId: alert._id,
        confirmedByResident: true,
        residentId: req.user.userId,
      },
    });

    await emitRealtime(io, {
      room: `user:${req.user.userId}`,
      event: "sos:resolved",
      payload: {
        alertId: alert._id,
        confirmedByResident: true,
      },
    });

    res.json({ alert });
  } catch (error) {
    next(error);
  }
}
