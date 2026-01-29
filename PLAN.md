# Questive Roadmap

## Overview

Three pillars: (1) Production readiness, (2) AI-powered task breakdowns, (3) Complementary features.

---

## Pillar 1: Production Readiness

### Phase 1A: Testing Foundation

**Framework: Vitest** (not Jest — native ESM, 3-5x faster, works with Next.js 16 + React 19 out of the box)

**Install:**
```
devDependencies: vitest @vitest/coverage-v8 @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Create:**
- `vitest.config.ts` — coverage thresholds at 95% (statements, branches, functions, lines), exclude `components/ui/**` (shadcn vendor code)
- `vitest.workspace.ts` — separate `unit` (jsdom) and `integration` (node) projects
- `tests/setup.ts` — RTL cleanup + jest-dom matchers
- `tests/helpers/mock-auth.ts` — shared `vi.mock('@/lib/auth')` with configurable session
- `tests/helpers/mock-db.ts` — Prisma client mock factory for all models
- `tests/helpers/mock-ai.ts` — Gemini model mock returning structured JSON
- `tests/helpers/render-with-providers.tsx` — custom render with SessionProvider + ThemeProvider

**Test structure:**
```
tests/
├── setup.ts
├── helpers/                    # Shared mocks
├── unit/
│   ├── lib/                   # utils, auth, db, ai/gemini
│   └── actions/               # All 7 server action files
├── components/                # Component tests (forms, taskboard, ai, settings, dashboard)
├── integration/               # Real DB tests (goal lifecycle, task board flow, AI flow)
└── e2e/
    └── smoke.test.ts          # Production canary (HTTP checks against live URL)
```

**Server action testing approach:** Mock `@/lib/auth`, `@/lib/db`, `next/cache` via `vi.mock()`. Test: auth guard, ownership checks, CRUD correctness, revalidation calls. AI actions additionally mock `@/lib/ai/gemini`.

**Component testing approach:** React Testing Library with custom render wrapper. Focus on interactive components (forms, dialogs, task board). Skip shadcn/ui vendor components.

**Integration tests:** Real PostgreSQL via Docker (existing `docker-compose.yml`). Mock only auth. Test multi-step flows (create category → goal → milestone → complete).

**Scripts to add to `package.json`:**
```json
"test": "vitest run --project unit",
"test:watch": "vitest --project unit",
"test:coverage": "vitest run --project unit --coverage",
"test:integration": "vitest run --project integration",
"test:smoke": "vitest run tests/e2e/smoke.test.ts",
"typecheck": "tsc --noEmit"
```

### Phase 1B: CI/CD Pipeline

**Pre-commit hooks:**
- Install `husky` + `lint-staged` (dev)
- `.husky/pre-commit` → `npx lint-staged` (ESLint fix + related tests)
- `.husky/pre-push` → `npm run typecheck`

**GitHub Actions `.github/workflows/ci.yml`:**

| Job | Trigger | What |
|-----|---------|------|
| `lint-and-typecheck` | push + PR | `npm run lint` + `tsc --noEmit` |
| `unit-tests` | push + PR | `vitest run --project unit --coverage` + post coverage report on PR |
| `integration-tests` | push + PR | Postgres service container + `vitest run --project integration` |
| `build` | push + PR (needs lint + unit) | `npm run build` |
| `smoke-tests` | main only (post-deploy) | Run `tests/e2e/smoke.test.ts` against production URL |

Coverage enforcement: `davelosert/vitest-coverage-report-action` posts coverage summary on PRs, fails if below 95%.

### Phase 1C: Monitoring & Observability

**Error tracking — Sentry:**
- Install `@sentry/nextjs`
- Create `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Wrap `next.config.ts` with `withSentryConfig`
- Add `app/global-error.tsx` error boundary
- Tunnel via `/monitoring` route to avoid ad blockers

**Structured logging — Pino:**
- Install `pino`
- Create `lib/logger.ts` with child loggers: `aiLogger`, `authLogger`, `dbLogger`
- Replace all `console.error`/`console.log` in `app/actions/ai.ts` and `app/actions/goals.ts`
- Redact sensitive fields (tokens, passwords)

**Health check endpoint:**
- Create `app/api/health/route.ts`
- Check: database connectivity (`SELECT 1`), AI config, auth config
- Return status `ok`/`degraded` with commit SHA

**Performance monitoring:**
- Install `@vercel/analytics` + `@vercel/speed-insights`
- Add `<Analytics />` + `<SpeedInsights />` to `app/layout.tsx`
- Enable Sentry Performance (automatic with `@sentry/nextjs`)
- Add slow query logging in `lib/db.ts` (warn on queries > 100ms via Prisma `$on('query')`)

**Dashboards (no custom infrastructure needed):**

| Dashboard | What it covers |
|-----------|---------------|
| Vercel Dashboard | Deployments, function execution, bandwidth |
| Vercel Analytics | Web Vitals (LCP, FID, CLS), page performance |
| Sentry Dashboard | Error trends, release health, performance traces |
| Neon Dashboard | DB size, connections, query performance |

**Alerting:**
- Sentry: alert on new errors, error rate > 10/min, P95 latency > 2s → Slack/email
- Better Uptime (free tier): ping `/api/health` every 3 min, alert on downtime — external to Vercel so catches platform outages too

### Phase 1D: Security Hardening

**Security headers in `next.config.ts`:**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HSTS)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (deny camera, microphone, geolocation)
- `Content-Security-Policy` (self + Google avatar images + Gemini API + Vercel analytics)

**Input validation — Zod:**
- Install `zod`
- Create `lib/validations.ts` with schemas for all server action inputs
- Add `schema.parse(rawData)` at the top of each server action

**Rate limiting — Upstash:**
- Install `@upstash/ratelimit` + `@upstash/redis`
- Add sliding window rate limit (100 req/min per IP) in `middleware.ts`

---

## Pillar 2: AI-Powered Task Breakdowns

### Phase 2A: Smarter Milestone Generation

**Current state:** `generateMilestones()` in `app/actions/ai.ts` produces 3-5 milestones with title + estimatedDays.

**Improvements:**

1. **Sub-task generation** — After creating milestones, offer to break each milestone into daily/weekly tasks
   - New action: `generateTasksForMilestone(milestoneId)`
   - Prompt includes milestone context, parent goal, user profile
   - Returns 3-7 actionable tasks per milestone with suggested due dates
   - UI: "Break down" button on each milestone in goal detail page

2. **Adaptive difficulty** — Use user profile (skills, experience, completed goals) to calibrate milestone complexity
   - Beginner users: more granular steps, shorter time estimates
   - Experienced users: higher-level milestones, longer sprints
   - Already partially supported via profile context in prompts — make it explicit

3. **Iterative refinement** — Let users refine AI suggestions
   - "Too broad" / "Too detailed" feedback buttons on milestone preview
   - Re-generate with adjusted granularity prompt parameter
   - New UI component: `MilestoneRefinementControls`

4. **Template library** — Cache common goal patterns
   - When AI generates milestones for popular goal types (fitness, learning, career), store anonymized templates
   - Offer "Start from template" as instant alternative to AI generation
   - New model: `MilestoneTemplate` with category, milestones JSON, usage count

### Phase 2B: Intelligent Task Board Enhancements

1. **Daily task plan generation** — AI generates a prioritized daily plan considering:
   - Upcoming milestone deadlines
   - Task dependencies (inferred from milestone order)
   - User's historical completion patterns
   - New action: `generateDailyPlan()` → returns ordered task list with time blocks

2. **Smart rescheduling** — When a task is overdue or skipped:
   - AI suggests how to redistribute remaining work
   - Adjusts downstream milestone dates
   - "Reschedule for me" button on overdue tasks

3. **Weekly AI review** — Uses the existing `getProModel()` (gemini-1.5-pro, currently unused)
   - Summarize week's accomplishments
   - Identify at-risk goals
   - Suggest focus areas for next week
   - New page: `app/dashboard/insights/page.tsx`

---

## Pillar 3: Complementary Features (Suggestions)

### Phase 3A: Data Export

- Export goals/milestones/tasks as CSV or JSON
- New action: `exportUserData(format: 'csv' | 'json')`
- Settings page: "Export my data" button
- Addresses FAQ item in User Guide

### Phase 3B: Goal Analytics Dashboard

- Visual progress charts (completion rate over time)
- Category breakdown pie chart
- Streak tracking (consecutive days with task completions)
- New page: `app/dashboard/analytics/page.tsx`
- Library: `recharts` (lightweight, React-native)

### Phase 3C: Notification System

- Email reminders for upcoming milestone deadlines
- Browser push notifications for daily task plans
- Configurable in settings (frequency, channels)
- Library: `@vercel/functions` for scheduled cron + Resend for email

---

## Implementation Priority

| Priority | Phase | What | New Packages |
|----------|-------|------|-------------|
| 1 | 1A | Testing foundation (Vitest + helpers + first tests) | vitest, @vitest/coverage-v8, @testing-library/*, jsdom |
| 2 | 1B | CI/CD (GitHub Actions + pre-commit hooks) | husky, lint-staged |
| 3 | 1A cont. | Reach 95% coverage across all actions + components | — |
| 4 | 1C | Monitoring (Sentry + Pino + health check + Vercel Analytics) | @sentry/nextjs, pino, @vercel/analytics, @vercel/speed-insights |
| 5 | 1D | Security (headers + Zod validation + rate limiting) | zod, @upstash/ratelimit, @upstash/redis |
| 6 | 2A | AI milestone → task breakdown + refinement | — |
| 7 | 2B | Daily plan generation + weekly AI review | — |
| 8 | 3A | Data export | — |
| 9 | 3B | Analytics dashboard | recharts |
| 10 | 3C | Notifications | resend |

---

## Files to Create (by phase)

### Phase 1A
| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest configuration with coverage thresholds |
| `vitest.workspace.ts` | Unit + integration project workspaces |
| `tests/setup.ts` | RTL cleanup + jest-dom matchers |
| `tests/helpers/mock-auth.ts` | Shared auth mock |
| `tests/helpers/mock-db.ts` | Prisma client mock factory |
| `tests/helpers/mock-ai.ts` | Gemini model mock |
| `tests/helpers/render-with-providers.tsx` | Custom render wrapper |
| `tests/unit/` | Unit test files |
| `tests/components/` | Component test files |
| `tests/integration/` | Integration test files |
| `tests/e2e/smoke.test.ts` | Production smoke test |

### Phase 1B
| File | Purpose |
|------|---------|
| `.husky/pre-commit` | Lint-staged pre-commit hook |
| `.husky/pre-push` | Typecheck pre-push hook |
| `.github/workflows/ci.yml` | CI/CD pipeline |

### Phase 1C
| File | Purpose |
|------|---------|
| `sentry.client.config.ts` | Sentry client config |
| `sentry.server.config.ts` | Sentry server config |
| `sentry.edge.config.ts` | Sentry edge config |
| `app/global-error.tsx` | Error boundary |
| `lib/logger.ts` | Pino structured logging |
| `app/api/health/route.ts` | Health check endpoint |

### Phase 1D
| File | Purpose |
|------|---------|
| `lib/validations.ts` | Zod schemas for all inputs |

### Phase 2A
| File | Purpose |
|------|---------|
| `components/ai/milestone-refinement-controls.tsx` | Refinement UI |

### Phase 2B
| File | Purpose |
|------|---------|
| `app/dashboard/insights/page.tsx` | Weekly AI review page |

### Phase 3A–3C
| File | Purpose |
|------|---------|
| `app/dashboard/analytics/page.tsx` | Analytics dashboard |
