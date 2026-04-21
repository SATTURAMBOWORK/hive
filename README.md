# AptHive

A SaaS-style, multi-tenant apartment community platform for Bangalore societies.

## Learning-first MERN Roadmap

1. Run base setup (backend + frontend + Mongo connection)
2. Implement auth (register/login with JWT)
3. Add multi-tenancy guards (`tenantId` on all data)
4. Add RBAC (resident, committee, staff, security, super_admin)
5. Build modules: announcements, tickets, events, amenities
6. Add Socket.io real-time updates
7. Add file uploads and audit logs
8. Deploy backend + frontend

## Project Structure

- `backend` -> Express API + Socket.io + MongoDB (Mongoose)
- `frontend` -> React + Vite app
- `docs` -> architecture and learning notes

## Quick Start

```bash
npm run install:all
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## Important

This starter intentionally includes TODO blocks for learning. We will implement each TODO together.

## Redis Setup (Backend)

Set these values in `backend/.env`:

```bash
REDIS_URL=redis://127.0.0.1:6379
REDIS_KEY_PREFIX=apthive
REDIS_CACHE_TTL_SECONDS=60
```

What Redis now powers:

- Distributed cache for amenities/events list APIs
- Shared auth rate limiting counters
- Reusable helpers for Pub/Sub, atomic counters, distributed locks, and queue operations
