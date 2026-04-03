# SocietyHub — Platform Documentation

> A SaaS-style, multi-tenant apartment community management platform.
> Built with the MERN stack: MongoDB, Express.js, React, Node.js.

---

## Table of Contents

1. [What This Platform Does](#1-what-this-platform-does)
2. [Architecture Overview](#2-architecture-overview)
3. [Feature Reference](#3-feature-reference)
4. [Role & Permission System](#4-role--permission-system)
5. [Real-Time System (Socket.io)](#5-real-time-system-socketio)
6. [Scaling to 100+ Concurrent Users](#6-scaling-to-100-concurrent-users)
7. [Security Model](#7-security-model)
8. [Data Models](#8-data-models)
9. [API Structure](#9-api-structure)
10. [Frontend Architecture](#10-frontend-architecture)
11. [What Still Needs to Be Built](#11-what-still-needs-to-be-built)
12. [Development Workflow](#12-development-workflow)

---

## 1. What This Platform Does

SocietyHub is a web portal for apartment housing societies. It replaces WhatsApp groups, printed notice boards, and verbal complaints with a single, organized platform that every resident, committee member, and staff person can use from any browser — no app download required.

### Who uses it

| Role | Who they are | What they do |
|---|---|---|
| **Resident** | Flat owner or tenant | Books amenities, raises tickets, views events & announcements |
| **Committee** | Society management committee | Creates announcements, events, approves members & bookings |
| **Staff** | Maintenance / housekeeping | Gets assigned to and resolves maintenance tickets |
| **Security** | Gate security | Manages visitor access (future feature) |
| **Super Admin** | Platform operator (you) | Creates and manages multiple societies on the platform |

### Core idea: Multi-tenancy

One codebase serves many housing societies. Each society is a **tenant** with its own slug (e.g. `green-heights`). All data — users, announcements, tickets, bookings — is strictly isolated per tenant. A resident of one society can never see data from another.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────┐
│           Browser (React)           │
│   Vite + React Router + Tailwind    │
│   Socket.io-client for live updates │
└────────────────┬────────────────────┘
                 │ HTTP / WebSocket
┌────────────────▼────────────────────┐
│         Node.js + Express           │
│   REST API  │  Socket.io Server     │
│   JWT Auth  │  Tenant Middleware    │
│   RBAC      │  Membership Guards    │
└────────────────┬────────────────────┘
                 │ Mongoose ODM
┌────────────────▼────────────────────┐
│            MongoDB Atlas            │
│   Collections: users, tenants,      │
│   memberships, announcements,       │
│   tickets, events, amenities,       │
│   bookings, wings, units, auditlogs │
└─────────────────────────────────────┘
```

### Request lifecycle

Every API call flows through this exact chain:

```
HTTP Request
  → app.js         (CORS, JSON parsing, Morgan logging)
  → routes/*.js    (URL matching, method matching)
  → auth.middleware.js     (is the JWT valid?)
  → tenant.middleware.js   (which society?)
  → membership.middleware.js (is the user an approved member?)
  → controller function    (the actual business logic)
  → Mongoose model         (database read/write)
  → JSON Response
```

---

## 3. Feature Reference

### 3.1 Authentication & Onboarding

- **Register** — email + password + role selection
- **OTP verification** — 6-digit code sent to email (currently dev-mode: logged to console)
- **Login** — returns JWT (7-day expiry), stored in browser localStorage
- **Multi-tenant login** — user provides their society's slug at login
- **Membership application** — after registering, residents submit a verification document and apply to join a society
- **Approval workflow** — committee/super_admin reviews pending applications and approves or rejects them
- **Blocked access** — unapproved residents are redirected to an onboarding waiting screen; they cannot access any other feature

### 3.2 Announcements

- Committee/super_admin can **create** announcements (title + body)
- All approved members of a society can **view** announcements
- Committee/super_admin can **edit** and **delete** announcements
- **Real-time** — when a new announcement is created, all connected residents of that society see it instantly without refreshing

### 3.3 Community Events

- Committee/super_admin can **create events** with title, description, location, start time, end time
- All approved members can **view** upcoming events
- Events are **sorted by start time** (soonest first)
- Committee/super_admin can **edit** event details or **cancel** events
- **Real-time** — event creation, updates, and deletions are pushed live to all connected members

### 3.4 Maintenance Tickets

- Any approved resident can **raise a ticket** with title, description, and category (e.g. plumbing, electrical, general)
- Ticket status lifecycle: `open → in_progress → resolved → closed`
- Committee/staff can **update status** and **assign** tickets
- Residents can see **their own tickets** and track progress
- **Real-time** — status changes are pushed live to the ticket owner

### 3.5 Amenity Booking

- Committee/super_admin can **create amenities** (gym, pool, clubhouse, etc.) with:
  - Operating hours (open time / close time)
  - Capacity
  - Photos
  - Auto-approve toggle (auto-approve vs manual approval)
- Residents can **browse available amenities** and **request a booking** (date + start time + end time)
- System **automatically detects conflicts** — two bookings cannot overlap for the same amenity
- Booking is validated against the amenity's operating hours
- Committee can **approve, reject, or cancel** bookings
- **Real-time** — booking status changes are pushed live to the requester

### 3.6 Society Setup (Admin)

- Super admin can create **Wings** (blocks/towers in the building, e.g. A-Wing, B-Wing)
- Super admin can create **Units** (individual flats, e.g. A-101, B-302) within each wing
- Units are marked **occupied** when a resident's membership is approved
- This structure links residents to their exact flat address

### 3.7 Admin: Member Approvals

- Committee/super_admin see a list of **pending membership applications**
- They can **approve** or **reject** each application
- On approval: the resident's membership status changes, their unit is marked occupied, and a real-time notification is sent to the resident
- Rejected residents are notified and cannot access the platform

### 3.8 Landing Page

- Public-facing marketing page at `/home`
- Full-screen hero section with product description
- Feature highlights grid
- Statistics section
- CTA buttons to Register or Sign In
- Responsive navbar
- Unauthenticated users land here first; authenticated users go directly to their Dashboard

### 3.9 Dashboard

- Shows a personalized summary for the logged-in user
- Links to all available features
- Committee/super_admin see admin controls in the navigation

---

## 4. Role & Permission System

Permissions are defined in `backend/src/config/roles.js` — the single source of truth.

```
RESIDENT      → read announcements, events, amenities
              → create/view own tickets
              → request amenity bookings
              → view own membership status

COMMITTEE     → everything a resident can do
              → create/edit/delete announcements
              → create/edit/delete events
              → approve/reject member applications
              → approve/reject amenity bookings
              → update ticket status & assignments
              → create wings and units

STAFF         → view and update assigned tickets

SECURITY      → future: visitor management

SUPER_ADMIN   → everything committee can do
              → manage multiple tenants
              → access all societies via x-tenant-id header
              → create new societies (tenants)
```

Every protected route runs through middleware that checks:
1. Is the JWT valid? (`auth.middleware.js`)
2. Which tenant does this request belong to? (`tenant.middleware.js`)
3. Does the user have an approved membership for this tenant? (`membership.middleware.js`)
4. Does the user's role have the required permission? (checked in controller)

---

## 5. Real-Time System (Socket.io)

Socket.io creates a persistent WebSocket connection between each browser and the server. This is separate from the regular HTTP API calls.

### How rooms work

When a user logs in, their browser automatically joins two Socket.io rooms:

```
user:{userId}      → for notifications sent only to this specific user
tenant:{tenantId}  → for broadcasts sent to everyone in the same society
```

### What triggers real-time events

| Action | Event emitted | Who receives it |
|---|---|---|
| New announcement created | `announcement:created` | Entire tenant room |
| Announcement updated | `announcement:updated` | Entire tenant room |
| Announcement deleted | `announcement:deleted` | Entire tenant room |
| New event created | `event:created` | Entire tenant room |
| Event updated | `event:updated` | Entire tenant room |
| Event deleted | `event:deleted` | Entire tenant room |
| Ticket status changed | `ticket:updated` | Entire tenant room |
| Booking status changed | `booking:updated` | Entire tenant room |
| Membership approved/rejected | `membership:updated` | User's personal room only |

---

## 6. Scaling to 100+ Concurrent Users

This is the **most important section for making the platform production-ready**.

Currently the app works fine for development. But if 100+ people open the app at the same time — all connected via Socket.io, all making API calls — the following problems will appear:

---

### Problem 1: Single server process gets overwhelmed

**What happens:** Node.js runs on a single thread. Under heavy load, one slow database query or CPU-heavy task blocks everyone else.

**Fix: Run multiple Node.js processes with PM2**

```bash
# Install PM2 (process manager)
npm install -g pm2

# Start 4 worker processes (one per CPU core)
pm2 start backend/src/server.js -i 4 --name societyhub-api
```

This spreads requests across 4 processes. If one crashes, the others keep running.

**Status:** Not implemented yet. Must be done before production launch.

---

### Problem 2: Socket.io breaks when running multiple processes

**What happens:** Socket.io rooms (like `tenant:{tenantId}`) live in memory of one process. If user A is connected to process 1 and an event fires in process 2, user A never receives it.

**Fix: Add Redis as a Socket.io adapter**

Redis is an in-memory store that all processes share. Socket.io uses it to synchronize messages across processes.

```
Process 1 ──→ Redis ──→ Process 2 ──→ User A's browser
```

Steps to implement:
1. Add Redis to your infrastructure (Redis Cloud free tier or Railway)
2. Install `@socket.io/redis-adapter` and `ioredis` in the backend
3. Configure the adapter in `backend/src/server.js`

```js
// backend/src/server.js  (to be added)
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "ioredis";

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

**Status:** Not implemented yet. Required for multi-process deployment.

---

### Problem 3: Database gets hammered by too many simultaneous queries

**What happens:** 100 users loading their dashboard at the same time = 100 simultaneous MongoDB queries. MongoDB Atlas free tier has connection limits.

**Fix: Mongoose connection pooling + MongoDB Atlas paid tier**

Mongoose already uses a connection pool by default (size: 5). For 100+ users, increase it:

```js
// backend/src/config/db.js  (to be updated)
mongoose.connect(MONGO_URI, {
  maxPoolSize: 50,   // allow up to 50 simultaneous DB connections
});
```

Also upgrade MongoDB Atlas from M0 (free) to M10 ($57/month) for production — it supports higher connection limits and has no bandwidth restrictions.

**Status:** Pool size not yet configured. Must be set before launch.

---

### Problem 4: No rate limiting — a single user can spam the API

**What happens:** A user (or bot) can send thousands of requests per second, slowing the server down for everyone.

**Fix: Add express-rate-limit**

```bash
npm install express-rate-limit
```

```js
// backend/src/app.js  (to be added)
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // max 100 requests per IP per window
  message: "Too many requests, please try again later.",
});

app.use("/api/", limiter);
```

**Status:** Not implemented. Critical for security and stability.

---

### Problem 5: Static files served slowly

**What happens:** Your React app's built files (JS, CSS, images) are large. Serving them from the same Node.js server wastes resources.

**Fix: Use a CDN**

Deploy the React frontend (`npm run build` → `dist/` folder) to **Vercel** or **Netlify**. These are global CDNs — they serve your static files from servers close to each user, extremely fast, for free.

The Node.js backend then only handles API calls and Socket.io, not static files.

**Status:** Not implemented. Part of the deployment phase.

---

### Problem 6: No caching — same data fetched from DB repeatedly

**What happens:** If 50 users open the Announcements page at the same time, that's 50 identical MongoDB queries for the same list.

**Fix: Add Redis caching for read-heavy endpoints**

```
Request for announcements
  → Check Redis cache first
  → If cached: return immediately (no DB call)
  → If not cached: query MongoDB, store result in Redis for 60 seconds, return
```

**Status:** Not implemented. A "nice to have" for 100+ users but becomes critical at 500+.

---

### Problem 7: No health monitoring — you won't know when it breaks

**What happens:** The server crashes at 2am, users get errors, you find out the next morning.

**Fix: Add uptime monitoring + structured logging**

- **Monitoring:** Use [UptimeRobot](https://uptimerobot.com) (free) — it pings your `/api/health` endpoint every 5 minutes and emails you if it goes down
- **Logging:** Replace `console.log` with a proper logger like `winston` or `pino` that writes structured JSON logs
- **Error tracking:** Add [Sentry](https://sentry.io) (free tier) to capture and report runtime errors automatically

**Status:** `/api/health` route exists. Monitoring and structured logging not set up.

---

### The Complete Scaling Checklist

| Step | What | Priority | Status |
|---|---|---|---|
| 1 | MongoDB connection pool (maxPoolSize: 50) | Critical | ❌ Not done |
| 2 | Rate limiting with express-rate-limit | Critical | ❌ Not done |
| 3 | Input validation with zod/express-validator | Critical | ❌ Not done |
| 4 | Deploy frontend to Vercel (separate from API) | Critical | ❌ Not done |
| 5 | Deploy backend to Railway/Render with PM2 | Critical | ❌ Not done |
| 6 | Add Redis adapter for Socket.io | Required for multi-process | ❌ Not done |
| 7 | Upgrade MongoDB Atlas to M10 | Required for production | ❌ Not done |
| 8 | Set up UptimeRobot monitoring | Important | ❌ Not done |
| 9 | Add Sentry error tracking | Important | ❌ Not done |
| 10 | Add Redis caching for announcements/events | Nice to have | ❌ Not done |
| 11 | Add database indexes on tenantId fields | Nice to have | ❌ Not done |
| 12 | Structured logging with Winston/Pino | Nice to have | ❌ Not done |

---

## 7. Security Model

### Authentication

- Passwords hashed with **bcrypt** (10 salt rounds) before storage — never stored as plain text
- **JWT tokens** expire after 7 days — users must re-login after expiry
- OTP tokens expire after a short window — cannot be reused

### Multi-tenant isolation

- Every database collection has a `tenantId` field
- The `tenant.middleware.js` extracts the tenant from the request on every call
- Every Mongoose query in every controller filters by `tenantId`
- This means: even if a user guesses another society's ID, the middleware blocks their access

### What still needs to be hardened

- **Input validation** — currently any string can be sent to the API. Must add zod/express-validator to all endpoints.
- **File upload validation** — when file uploads are added, must restrict file types and sizes
- **HTTPS** — must be enforced in production via reverse proxy (Nginx) or the hosting platform (Railway/Render do this automatically)
- **Helmet.js** — must add to set secure HTTP headers
- **Rate limiting** — see Section 6 above

---

## 8. Data Models

### User
```
fullName, email, passwordHash, role,
flatNumber, phone, isVerified,
otpCode, otpExpiresAt
```

### Tenant (Society)
```
name, slug (unique, e.g. "green-heights"),
city, address, isActive
```

### Membership
```
userId → tenantId → unitId → wingId,
status: pending | approved | rejected,
verificationDocUrl
```

### Announcement
```
tenantId, title, body,
createdBy (→ User)
```

### Event
```
tenantId, title, description,
location, startAt, endAt,
createdBy (→ User)
```

### Ticket
```
tenantId, title, description, category,
status: open | in_progress | resolved | closed,
createdBy (→ User), assignedTo (→ User)
```

### Amenity
```
tenantId, name, description, photos[],
capacity, isAutoApprove,
operatingHours: { open, close }
```

### AmenityBooking
```
tenantId, amenityId (→ Amenity),
date, startTime, endTime,
status: pending | approved | rejected | cancelled,
requestedBy (→ User)
```

### SocietyWing
```
tenantId, name (e.g. "A-Wing"), code
```

### SocietyUnit
```
tenantId, wingId (→ Wing),
unitNumber (e.g. "A-101"), floor, isActive
```

### AuditLog *(defined, not yet integrated)*
```
tenantId, userId, action, resourceType,
resourceId, details, createdAt
```

---

## 9. API Structure

All routes are prefixed with `/api`.

```
POST   /api/auth/register
POST   /api/auth/verify-otp
POST   /api/auth/login

GET    /api/health

GET    /api/membership/status
POST   /api/membership/apply
GET    /api/membership/pending          (committee+)
PATCH  /api/membership/:id/approve      (committee+)
PATCH  /api/membership/:id/reject       (committee+)

GET    /api/announcements
POST   /api/announcements               (committee+)
PATCH  /api/announcements/:id           (committee+)
DELETE /api/announcements/:id           (committee+)

GET    /api/events
POST   /api/events                      (committee+)
PATCH  /api/events/:id                  (committee+)
DELETE /api/events/:id                  (committee+)

GET    /api/tickets
POST   /api/tickets
PATCH  /api/tickets/:id                 (committee/staff)

GET    /api/amenities
POST   /api/amenities                   (committee+)
GET    /api/amenities/:id/bookings
POST   /api/amenities/:id/book
PATCH  /api/amenities/bookings/:id      (committee+)

GET    /api/societies/wings             (super_admin)
POST   /api/societies/wings             (super_admin)
GET    /api/societies/units             (super_admin)
POST   /api/societies/units             (super_admin)

GET    /api/admin/members               (committee+)
```

---

## 10. Frontend Architecture

### File structure

```
frontend/src/
├── main.jsx              ← React entry point, wraps app with BrowserRouter + AuthProvider
├── App.jsx               ← Route definitions, protected route guards
├── layout/
│   ├── MainLayout.jsx    ← TopNav + page content wrapper (used by all logged-in pages)
│   └── global.css        ← Tailwind imports + base styles + component classes
├── components/
│   ├── AuthContext.jsx   ← Global auth state: user, token, isLoggedIn, login(), logout()
│   ├── TopNav.jsx        ← Navigation bar, role-aware links
│   ├── AdminManager.jsx  ← Committee/admin management UI component
│   ├── AmenityGrid.jsx   ← Displays amenity cards
│   └── BookingForm.jsx   ← Amenity booking form
└── pages/
    ├── LandingPage.jsx       ← Public marketing page (/home)
    ├── LoginPage.jsx         ← Login form
    ├── RegisterPage.jsx      ← Registration form with OTP step
    ├── OnboardingPage.jsx    ← Membership application for new residents
    ├── DashboardPage.jsx     ← Home page for logged-in users
    ├── AnnouncementsPage.jsx ← View + create announcements
    ├── EventsPage.jsx        ← View + create events
    ├── TicketsPage.jsx       ← Raise + track tickets
    ├── AmenitiesPage.jsx     ← Browse + book amenities
    ├── AdminApprovalsPage.jsx← Approve/reject member applications
    └── SocietySetupPage.jsx  ← Manage wings + units
```

### State management

Currently all state is managed with React's built-in `useState` and `useEffect`, plus one global context (`AuthContext`). This is correct and sufficient for this project size. If complexity grows significantly, `Zustand` is the recommended next step (simpler than Redux).

### How real-time updates work in the frontend

```
AuthContext.jsx
  ↓ on login
  → connects Socket.io client to backend
  → joins socket rooms: user:{userId} and tenant:{tenantId}

Each page (e.g. AnnouncementsPage.jsx)
  → on mount: fetches data via HTTP API
  → sets up socket listener for relevant events
  → when socket event fires: updates local state (re-renders)
  → on unmount: removes socket listener
```

---

## 11. What Still Needs to Be Built

Listed in recommended implementation order:

### Immediate (before showing to anyone)
- [ ] **Input validation** — add zod to all backend routes; show field errors in frontend forms
- [ ] **Error toasts** — global toast notification in React so API errors display nicely
- [ ] **Loading states** — consistent loading spinners on all pages
- [ ] **Real OTP email delivery** — integrate Nodemailer + Gmail/Resend so OTPs are actually emailed

### Core features missing
- [ ] **File uploads** — residents need to upload verification documents (Multer + Cloudinary)
- [ ] **Real dashboard** — DashboardPage should show live counts (pending tickets, upcoming events, etc.) from a summary API endpoint
- [ ] **User profile page** — view/edit name, phone, flat number
- [ ] **Notification center** — bell icon in TopNav with unread count; list of past notifications

### Polish
- [ ] **Search** — search announcements, filter tickets by status, filter events by date
- [ ] **Pagination** — announcements and tickets lists need pagination for large datasets
- [ ] **Audit logs** — write to the AuditLog collection on key actions (approve member, change ticket status, etc.)
- [ ] **Helmet.js** — secure HTTP headers

### Production readiness (Section 6 items)
- [ ] Rate limiting
- [ ] MongoDB connection pool config
- [ ] Redis adapter for Socket.io
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway/Render
- [ ] Set up UptimeRobot monitoring
- [ ] Set up Sentry error tracking

---

## 12. Development Workflow

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free M0 cluster is fine for dev)
- A `.env` file in `/backend` (copy from `.env.example`)

### Starting the dev servers

```bash
# From the project root
npm run install:all   # install dependencies for both backend and frontend
npm run dev           # starts both servers concurrently
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

### Creating the first super admin (one-time setup)

```bash
cd backend
node src/scripts/seed-super-admin.js
```

### Creating a test tenant/society

```bash
cd backend
node src/scripts/seed-tenant.js
```

### Environment variables (`backend/.env`)

```
MONGO_URI=mongodb+srv://...
JWT_SECRET=a_long_random_string
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
SUPER_ADMIN_SIGNUP_KEY=your_secret_key
```
