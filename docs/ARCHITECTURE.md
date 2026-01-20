# Architecture

This document describes the system architecture, data flow, and security measures of Goal Tracker.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Data Model](#data-model)
- [Authentication Flow](#authentication-flow)
- [Security](#security)
- [Deployment Architecture](#deployment-architecture)

---

## System Overview

Goal Tracker is a serverless application built on Next.js and deployed on Vercel. The architecture follows a modern JAMstack approach with server-side rendering and server actions for data mutations.

### Key Design Principles

1. **Serverless First** - No servers to manage; scales automatically
2. **Edge-Ready** - Middleware runs at the edge for fast auth checks
3. **Type-Safe** - End-to-end TypeScript with Prisma for database safety
4. **Privacy-Focused** - Minimal data collection, user owns their data

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Edge Cache    │  │   Middleware    │  │  Static Assets  │  │
│  │   (ISR/SSG)     │  │  (Auth Check)   │  │   (CDN)         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Serverless Functions                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Server Actions │  │   API Routes    │  │   RSC Render    │  │
│  │  (Mutations)    │  │   (NextAuth)    │  │   (Data Fetch)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        External Services                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Neon PostgreSQL │  │  Google OAuth   │  │  Vercel Blob    │  │
│  │   (Database)    │  │ (Authentication)│  │ (Future Images) │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │   Category   │       │     Goal     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │──┐    │ id           │──┐    │ id           │
│ name         │  │    │ name         │  │    │ title        │
│ email        │  │    │ color        │  │    │ description  │
│ image        │  │    │ icon         │  │    │ status       │
│ createdAt    │  │    │ userId    ◄──┘  │    │ priority     │
│ updatedAt    │  │    │ createdAt    │  │    │ targetDate   │
└──────────────┘  │    │ updatedAt    │  │    │ categoryId◄──┘
                  │    └──────────────┘  │    │ userId    ◄──┐
                  │                      │    │ createdAt    │
                  │                      │    │ updatedAt    │
                  │                      │    └──────────────┘
                  │                      │           │
                  │                      │           ▼
                  │                      │    ┌──────────────┐
                  │                      │    │  Milestone   │
                  │                      │    ├──────────────┤
                  │                      │    │ id           │
                  │                      │    │ title        │
                  │                      │    │ status       │
                  │                      │    │ dueDate      │
                  │                      │    │ completedAt  │
                  │                      │    │ notes        │
                  │                      └───►│ goalId       │
                  │                           │ createdAt    │
                  │                           │ updatedAt    │
                  │                           └──────────────┘
                  │
                  ▼
        (All entities cascade delete when User is deleted)
```

### Data Ownership

- Each **User** owns their **Categories** and **Goals**
- **Categories** contain **Goals**
- **Goals** contain **Milestones**
- Deleting a User cascades to delete all their data

### Enums

| Enum | Values | Description |
|------|--------|-------------|
| GoalStatus | NOT_STARTED, IN_PROGRESS, COMPLETED, ON_HOLD | Current state of a goal |
| Priority | LOW, MEDIUM, HIGH | Goal priority level |
| MilestoneStatus | PENDING, COMPLETED | Milestone completion state |

---

## Authentication Flow

Goal Tracker uses NextAuth.js v5 with Google OAuth for authentication.

### Sign-In Flow

```
┌──────┐     ┌──────────┐     ┌────────┐     ┌──────────┐     ┌────────┐
│ User │     │ App Home │     │ Google │     │ NextAuth │     │Database│
└──┬───┘     └────┬─────┘     └───┬────┘     └────┬─────┘     └───┬────┘
   │              │               │               │               │
   │ Click Sign In│               │               │               │
   │─────────────►│               │               │               │
   │              │               │               │               │
   │              │ Redirect to Google            │               │
   │              │──────────────►│               │               │
   │              │               │               │               │
   │         Enter credentials    │               │               │
   │◄─────────────────────────────│               │               │
   │─────────────────────────────►│               │               │
   │              │               │               │               │
   │              │  Auth code + user info        │               │
   │              │◄──────────────│               │               │
   │              │               │               │               │
   │              │               │ Callback      │               │
   │              │               │──────────────►│               │
   │              │               │               │               │
   │              │               │               │ Create/Update │
   │              │               │               │ User + Session│
   │              │               │               │──────────────►│
   │              │               │               │◄──────────────│
   │              │               │               │               │
   │              │ Set session cookie            │               │
   │◄─────────────│◄──────────────────────────────│               │
   │              │               │               │               │
   │ Redirect to /dashboard       │               │               │
   │◄─────────────│               │               │               │
```

### Session Management

- Sessions are stored in the database (PostgreSQL)
- Session tokens are HTTP-only cookies
- Middleware checks auth state at the edge for protected routes

---

## Security

### Data Protection

| Measure | Implementation |
|---------|----------------|
| **Authentication** | Google OAuth 2.0 via NextAuth.js |
| **Authorization** | Server-side checks on all data operations |
| **Data Isolation** | All queries filter by authenticated userId |
| **Transport Security** | HTTPS enforced via Vercel |
| **Session Security** | HTTP-only cookies, database-backed sessions |

### What We Store

| Data | Purpose | Retention |
|------|---------|-----------|
| Email | Account identification | Until account deletion |
| Name | Display purposes | Until account deletion |
| Profile Image | Avatar display | Until account deletion |
| Goals/Categories | Core functionality | Until user deletes |

### What We DON'T Store

- Passwords (Google handles authentication)
- Payment information
- Location data
- Usage analytics/tracking

### Data Deletion

Users can delete their account at any time. Deletion cascades to remove:
- All categories
- All goals
- All milestones
- Session data

### Authorization Checks

Every server action verifies:

```typescript
// 1. User is authenticated
const session = await auth();
if (!session?.user?.id) {
  throw new Error("Unauthorized");
}

// 2. User owns the resource
const category = await db.category.findFirst({
  where: {
    id: categoryId,
    userId: session.user.id  // Ownership check
  }
});
```

---

## Deployment Architecture

### Production (Vercel + Neon)

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Edge      │  │  Serverless │  │    Static Assets    │  │
│  │  Middleware │  │  Functions  │  │    (Global CDN)     │  │
│  │  (Auth)     │  │  (Actions)  │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘  │
└─────────┼────────────────┼──────────────────────────────────┘
          │                │
          │                ▼
          │    ┌─────────────────────────────────────────────┐
          │    │              Neon PostgreSQL                 │
          │    │  ┌─────────────┐  ┌─────────────────────┐   │
          │    │  │   Primary   │  │   Connection Pool   │   │
          │    │  │   Database  │  │   (Serverless)      │   │
          │    │  └─────────────┘  └─────────────────────┘   │
          │    └─────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│    Google OAuth     │
│    (Auth Provider)  │
└─────────────────────┘
```

### Local Development (Docker)

```
┌─────────────────────────────────────────────────────────────┐
│                     Local Machine                            │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │    Next.js Dev Server   │  │    Docker Container     │   │
│  │    (localhost:3000)     │  │    PostgreSQL:17        │   │
│  │                         │  │    (localhost:5432)     │   │
│  └────────────┬────────────┘  └────────────┬────────────┘   │
│               │                            │                 │
│               └────────────────────────────┘                 │
│                     (DATABASE_URL)                           │
└─────────────────────────────────────────────────────────────┘
```

### Scaling Considerations

| Load Level | Vercel | Neon PostgreSQL |
|------------|--------|-----------------|
| Hobby | Free tier (100GB bandwidth) | Free tier (0.5GB storage) |
| Growing | Pro ($20/mo) | Launch ($19/mo) |
| Scale | Enterprise | Scale (usage-based) |

The serverless architecture means:
- **No cold starts** for frequently accessed routes
- **Auto-scaling** based on traffic
- **Global distribution** via Vercel's edge network
- **Connection pooling** via Neon for database efficiency
