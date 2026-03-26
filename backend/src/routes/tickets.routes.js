import { Router } from "express";
import { createTicket, listTickets, updateTicketStatus } from "../controllers/tickets.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";
import { requireTenantScope } from "../middlewares/tenant.middleware.js";

const ticketRouter = Router();

ticketRouter.use(requireAuth, requireTenantScope);
ticketRouter.get("/", listTickets);
ticketRouter.post("/", createTicket);
ticketRouter.patch("/:ticketId/status", requireRoles("committee", "staff", "super_admin"), updateTicketStatus);

export { ticketRouter };
