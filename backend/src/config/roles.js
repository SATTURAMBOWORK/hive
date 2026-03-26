//Single source of truth for RBAC
// As the app grows, roles and permissions get used in routes, controllers, and UI. A centralized map prevents duplicated strings, mismatched checks, and accidental privilege bugs.

export const ROLES = {
  RESIDENT: "resident",
  COMMITTEE: "committee",
  STAFF: "staff",
  SECURITY: "security",
  SUPER_ADMIN: "super_admin"
};

export const PERMISSIONS = {
  ANNOUNCEMENT_CREATE: "announcement:create",
  TICKET_UPDATE_STATUS: "ticket:update_status",
  EVENT_CREATE: "event:create",
  AMENITY_APPROVE: "amenity:approve"
};

export const ROLE_PERMISSIONS = {
  [ROLES.RESIDENT]: [],
  [ROLES.COMMITTEE]: [
    PERMISSIONS.ANNOUNCEMENT_CREATE,
    PERMISSIONS.TICKET_UPDATE_STATUS,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.AMENITY_APPROVE
  ],
  [ROLES.STAFF]: [PERMISSIONS.TICKET_UPDATE_STATUS],
  [ROLES.SECURITY]: [],
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.ANNOUNCEMENT_CREATE,
    PERMISSIONS.TICKET_UPDATE_STATUS,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.AMENITY_APPROVE
  ]
};
