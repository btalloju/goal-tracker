# Questive Roadmap

## Current Status

**Latest Release:** Phase 1A - Testing Foundation ✅ (Completed)
- Vitest testing framework configured with 95% coverage targets
- Comprehensive test helpers and mocking infrastructure
- Unit, component, integration, and E2E test structure established

**Current Branch:** `feature/phase-1a-testing-foundation`

---

## Overview

Questive's development roadmap is organized around four main pillars:

1. **Production Readiness** - Testing, CI/CD, monitoring, and security
2. **AI-Powered Features** - Enhanced AI capabilities for task breakdowns and planning
3. **AI Agent Integration** - NEW: Execute tasks with AI agents
4. **Complementary Features** - Data export, analytics, notifications

---

## Pillar 1: Production Readiness

### Phase 1A: Testing Foundation ✅ COMPLETED

**Framework: Vitest** (native ESM, 3-5x faster than Jest, works with Next.js 16 + React 19)

**Delivered:**
- ✅ `vitest.config.ts` with 95% coverage thresholds
- ✅ `vitest.workspace.ts` for unit and integration projects
- ✅ Test helpers: mock-auth, mock-db, mock-ai, render-with-providers
- ✅ Test structure for unit, components, integration, and E2E tests
- ✅ npm scripts: test, test:watch, test:coverage, test:integration, test:smoke

### Phase 1B: CI/CD Pipeline 🔄 NEXT

**Pre-commit hooks:**
- Install `husky` + `lint-staged`
- `.husky/pre-commit` → ESLint fix + related tests
- `.husky/pre-push` → Typecheck

**GitHub Actions:**
- Lint and typecheck on push + PR
- Unit tests with coverage reporting
- Integration tests with Postgres container
- Build verification
- Smoke tests on main branch (post-deploy)

**New packages:** `husky`, `lint-staged`

### Phase 1C: Monitoring & Observability

**Error tracking - Sentry:**
- Client, server, and edge configurations
- Error boundary with `app/global-error.tsx`
- Tunnel via `/monitoring` to avoid ad blockers

**Structured logging - Pino:**
- `lib/logger.ts` with child loggers (aiLogger, authLogger, dbLogger)
- Replace all console.error/log
- Redact sensitive fields

**Health check endpoint:**
- `app/api/health/route.ts`
- Check database, AI config, auth config
- Return status with commit SHA

**Performance monitoring:**
- Vercel Analytics + Speed Insights
- Sentry Performance
- Slow query logging (>100ms)

**Dashboards:**
- Vercel: Deployments, functions, bandwidth
- Vercel Analytics: Web Vitals
- Sentry: Error trends, performance traces
- Neon: DB metrics

**New packages:** `@sentry/nextjs`, `pino`, `@vercel/analytics`, `@vercel/speed-insights`

### Phase 1D: Security Hardening

**Security headers:**
- X-Frame-Options, X-Content-Type-Options, HSTS
- Referrer-Policy, Permissions-Policy
- Content-Security-Policy

**Input validation - Zod:**
- `lib/validations.ts` with schemas for all server actions
- Schema validation at action entry points

**Rate limiting - Upstash:**
- Sliding window rate limit (100 req/min per IP)
- Middleware implementation

**New packages:** `zod`, `@upstash/ratelimit`, `@upstash/redis`

---

## Pillar 2: AI-Powered Task Breakdowns

### Phase 2A: Smarter Milestone Generation

**Improvements:**
1. **Sub-task generation** - Break milestones into daily/weekly tasks
   - New action: `generateTasksForMilestone(milestoneId)`
   - Returns 3-7 actionable tasks with suggested due dates
   - UI: "Break down" button on each milestone

2. **Adaptive difficulty** - Calibrate based on user profile
   - Beginner: More granular steps, shorter estimates
   - Experienced: Higher-level milestones, longer sprints

3. **Iterative refinement** - User feedback on suggestions
   - "Too broad" / "Too detailed" buttons
   - Re-generate with adjusted granularity
   - New component: `MilestoneRefinementControls`

4. **Template library** - Cache common goal patterns
   - Store anonymized templates for popular goals
   - "Start from template" option
   - New model: `MilestoneTemplate`

### Phase 2B: Intelligent Task Board Enhancements

1. **Daily task plan generation**
   - AI considers deadlines, dependencies, completion patterns
   - New action: `generateDailyPlan()`
   - Returns ordered task list with time blocks

2. **Smart rescheduling**
   - AI suggests redistribution for overdue tasks
   - Adjusts downstream milestone dates
   - "Reschedule for me" button

3. **Weekly AI review** - Uses `getProModel()` (gemini-1.5-pro)
   - Summarize accomplishments
   - Identify at-risk goals
   - Suggest focus areas
   - New page: `app/dashboard/insights/page.tsx`

---

## Pillar 3: AI Agent Integration with CrewAI 🆕

**Status:** Planned | **Timeline:** 6 weeks | **Type:** CrewAI-First Approach

### Overview

Enable AI agents to **execute** tasks on behalf of users, not just plan them. Uses [CrewAI](https://www.crewai.com/), an open-source framework for orchestrating role-playing autonomous AI agents.

**Why CrewAI?**
- ✅ **Official Google Gemini support** - Already using Gemini in Questive
- ✅ **100,000+ developers certified** - Mature, well-supported ecosystem
- ✅ **5.76x faster than LangGraph** - High performance
- ✅ **Built-in tools** - Gmail, Google Docs, Sheets, Search - no external accounts needed
- ✅ **Sequential execution** - Matches milestone → task workflow perfectly

**Key Features:**
- ✅ All task types: Writing, Research, Data/Spreadsheets, Communication
- ✅ Hybrid autonomy: Low-risk tasks auto-approved, high-risk need approval
- ✅ 4 pre-built crews with specialized agents
- ✅ Risk classification system (LOW/MEDIUM/HIGH)

### Architecture

**Python Microservice + Next.js Frontend**

```
Next.js (TypeScript) ←→ FastAPI (Python) ←→ CrewAI ←→ Gemini + Tools
```

**Component Responsibilities:**
- **Next.js**: UI, database, auth, crew assignment
- **Python Service**: CrewAI orchestration, agent execution, tool integration
- **CrewAI**: Multi-agent coordination, task execution
- **Tools**: Google Search, Gmail, Docs, Sheets APIs

### Database Schema

**3 New Models:**
```prisma
- AgentCrew (crew definitions with JSON config)
- CrewExecution (execution tracking, progress, results, artifacts)
- AgentSettings (user preferences for autonomy and notifications)
```

**Updated Models:**
```prisma
Task: + agentCrewId, agentStatus, agentAssignedAt
User: + agentCrews[], crewExecutions[], agentSettings
```

### 4 Pre-Built Crews

#### 1. Research Crew (LOW RISK)
- **Agents:** Senior Researcher + Research Analyst
- **Tools:** Google Search, Web Scraper
- **Process:** Sequential (search → analyze)
- **Output:** Markdown research report with sources

#### 2. Content Writer Crew (LOW RISK)
- **Agents:** Content Strategist + Writer + Editor
- **Tools:** Google Docs API, Grammarly (optional)
- **Process:** Sequential (plan → write → edit)
- **Output:** Google Doc link with drafted content

#### 3. Data Analysis Crew (MEDIUM RISK)
- **Agents:** Data Analyst + Visualization Specialist
- **Tools:** Google Sheets API, Pandas
- **Process:** Sequential (analyze → visualize)
- **Output:** New Google Sheet with analysis and charts

#### 4. Communication Crew (HIGH RISK)
- **Agents:** Email Composer + Scheduler
- **Tools:** Gmail API, Google Calendar API
- **Process:** Parallel (compose and schedule independently)
- **Output:** Sent emails and calendar events

### Implementation Timeline (6 Weeks)

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Infrastructure | Database migrations, risk classifier, Python service scaffolding |
| 2 | CrewAI Core | FastAPI setup, Research Crew, Google Search tool |
| 3 | Additional Crews | Writer, Data, Communication crews + tools (Docs, Sheets, Gmail) |
| 4 | Next.js Integration | CrewAI client, server actions, webhook callbacks |
| 5 | Crew Definitions | Configure all 4 crews, approval workflows, UI components |
| 6 | Testing & Launch | Unit tests, integration tests, E2E tests, beta rollout |

### Key Files

**Python CrewAI Service (New):**
- `crewai-service/app/main.py` - FastAPI entry point
- `crewai-service/app/crews/research_crew.py` - Research agents implementation
- `crewai-service/app/tools/google_search.py` - Search tool
- `crewai-service/app/routes/executions.py` - Execution API endpoints

**Next.js Integration:**
- `lib/crewai-client.ts` - Python service API client
- `app/actions/crews.ts` - assignTaskToCrew, approveExecution
- `components/agents/assign-crew-dialog.tsx` - Crew selection UI
- `app/dashboard/crews/page.tsx` - Execution dashboard

### Deployment

**Python Service:** Railway (recommended), Render, or Vercel Python Functions
**Next.js:** Existing Vercel deployment
**Database:** Same PostgreSQL (Neon) with new tables

### Environment Variables

**New for Next.js:**
```bash
CREWAI_SERVICE_URL=https://crewai-service.railway.app
CREWAI_SERVICE_API_KEY=<shared-secret>
```

**Python Service:**
```bash
GOOGLE_AI_API_KEY=  # Gemini (same as Next.js)
SERPAPI_KEY=        # Google Search
GMAIL_CLIENT_ID=    # Gmail OAuth
GOOGLE_DOCS_API_KEY=
API_KEY=            # Next.js ↔ Python auth
```

### Rollout Strategy

**Week 1:** Deploy to Railway staging, test connectivity
**Weeks 2-4:** Internal testing and refinement
**Week 5:** Beta launch (20-30 users with `betaFeatures: ['crewai']`)
**Week 6:** Public launch with gradual rollout (10% → 50% → 100%)

### Success Metrics

**Phase 1 (Week 8):**
- 40% of active users try at least one crew
- 85% execution success rate
- <3min average execution time
- Zero Gemini API key leaks

**Phase 1 (Month 2):**
- 60% of users with goals assign tasks to crews
- Research crew: 90% satisfaction
- Writer crew: 80% content accepted without edits
- 500+ total crew executions

### Future: External Platforms (Phase 2)

**Deferred until user demand validated:**
- Zapier integration for custom workflows
- Make.com visual builder
- n8n for self-hosted automation

**Rationale:** CrewAI already provides Gmail, Docs, Sheets, and Search capabilities. External platforms add complexity and require additional accounts. Validate CrewAI value first.

### Technical References

- [CrewAI Official Docs](https://docs.crewai.com/en/introduction)
- [Google Gemini + CrewAI Example](https://ai.google.dev/gemini-api/docs/crewai-example)
- [CrewAI Quickstart](https://github.com/google-gemini/crewai-quickstart)
- [CrewAI Framework Review 2025](https://latenode.com/blog/ai-frameworks-technical-infrastructure/crewai-framework/crewai-framework-2025-complete-review-of-the-open-source-multi-agent-ai-platform)

---

## Pillar 4: Complementary Features

### Phase 4A: Data Export

- Export goals/milestones/tasks as CSV or JSON
- New action: `exportUserData(format)`
- Settings page: "Export my data" button

### Phase 4B: Goal Analytics Dashboard

- Visual progress charts (completion rate over time)
- Category breakdown pie chart
- Streak tracking (consecutive days with completions)
- New page: `app/dashboard/analytics/page.tsx`
- Library: `recharts`

### Phase 4C: Notification System

- Email reminders for milestone deadlines
- Browser push notifications for daily task plans
- Configurable in settings
- Libraries: `@vercel/functions`, `resend`

---

## Implementation Priority

| Priority | Phase | Timeline | Status |
|----------|-------|----------|--------|
| 1 | **1A: Testing Foundation** | ✅ Complete | Done |
| 2 | **1B: CI/CD** | 2 weeks | Next |
| 3 | **1A cont.: 95% Coverage** | 2 weeks | Planned |
| 4 | **1C: Monitoring** | 2 weeks | Planned |
| 5 | **1D: Security** | 1 week | Planned |
| 6 | **3: CrewAI Integration (Weeks 1-3)** | 3 weeks | Planned |
| 7 | **3: CrewAI Integration (Weeks 4-6)** | 3 weeks | Planned |
| 8 | **2A: Smarter Milestones** | 2 weeks | Planned |
| 9 | **2B: Task Board Intelligence** | 2 weeks | Planned |
| 10 | **4A: Data Export** | 1 week | Future |
| 11 | **4B: Analytics** | 2 weeks | Future |
| 12 | **4C: Notifications** | 2 weeks | Future |

**Note:** CrewAI integration (Priority 6-7) replaces the original external platform + built-in agents approach. It's 2 weeks faster (6 weeks vs 8 weeks) and provides a more integrated solution.

---

## Research & References

**AI Agent Integration Research:**
- [Agentic AI Trends for 2026 (Gartner)](https://www.ema.co/additional-blogs/addition-blogs/agentic-ai-trends-predictions-2025) - 40% of enterprise apps will embed AI agents
- [Top AI Agent Frameworks](https://www.shakudo.io/blog/top-9-ai-agent-frameworks) - LangChain, AutoGen, CrewAI comparison
- [AI Automation Platforms](https://www.lindy.ai/blog/ai-automation-platform) - Zapier, Make, n8n capabilities
- [Azure AI Agent Service](https://azure.microsoft.com/en-us/blog/ai-agents-at-work-the-new-frontier-in-business-automation/) - Enterprise patterns
- [Generative Workflow Engines](https://machinelearningmastery.com/7-agentic-ai-trends-to-watch-in-2026/) - Multi-agent orchestration

**Platform-Specific:**
- [CrewAI Multi-Agent Platform](https://www.crewai.com/)
- [n8n AI Agents](https://n8n.io/ai-agents/)
- [Agentic AI Tools for Enterprise](https://www.moveworks.com/us/en/resources/blog/agentic-ai-tools-for-business)

---

## Getting Involved

Questive is open source! Here's how you can contribute:

- **Report Bugs:** [GitHub Issues](https://github.com/btalloju/goal-tracker/issues)
- **Suggest Features:** Open a feature request issue
- **Contribute Code:** See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Improve Docs:** Submit PRs for documentation updates

---

**Last Updated:** February 1, 2026
