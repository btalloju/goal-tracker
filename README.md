# Questive

Your life goals, intelligently prioritized. Questive transforms overwhelming life goals into an achievable daily practice by helping you prioritize what matters, break down ambitious dreams into actionable steps, and maintain sustainable momentum without burnout.

<p align="center">
  <a href="https://goal-tracker-ivory-eight.vercel.app"><strong>Try Questive Now</strong></a>
</p>

---

## What is Questive?

Questive is a free, open-source goal tracking application that helps you:

- **Organize your life** - Create categories for different areas (Health, Career, Personal, Learning)
- **Set meaningful goals** - Define goals with priorities, target dates, and progress tracking
- **Break down the journey** - Split goals into actionable milestones with due dates
- **Stay focused daily** - Use the task board to know exactly what to work on today
- **Let AI help** - Generate milestones automatically and let AI prioritize your tasks

### AI-Powered Features

- **Smart Milestone Suggestions** - Enter a goal and let AI break it down into achievable steps
- **Intelligent Task Prioritization** - AI analyzes deadlines, goal importance, and dependencies to order your daily tasks

---

## Get Started

**[Read the User Guide](docs/USER_GUIDE.md)** to learn how to make the most of Questive.

Quick links:
- [Creating Categories](docs/USER_GUIDE.md#managing-categories)
- [Setting Goals](docs/USER_GUIDE.md#managing-goals)
- [Using Milestones](docs/USER_GUIDE.md#working-with-milestones)
- [AI Features](docs/USER_GUIDE.md#ai-features)
- [Tips for Success](docs/USER_GUIDE.md#tips-for-success)

---

## For Developers

### Quick Start

**Prerequisites:** Node.js 18+, Docker Desktop, Google Cloud Console account

```bash
# Clone and install
git clone https://github.com/btalloju/goal-tracker.git
cd goal-tracker
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Start database and run
docker compose up -d
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` | Yes |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | Yes |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | Yes |
| `GOOGLE_AI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/apikey) | No (enables AI) |

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Database | [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/) |
| ORM | [Prisma](https://www.prisma.io/) |
| Authentication | [NextAuth.js v5](https://authjs.dev/) |
| AI | [Google Gemini](https://ai.google.dev/) (gemini-2.5-flash) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Deployment | [Vercel](https://vercel.com/) |

### Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, and security |
| [Contributing](docs/CONTRIBUTING.md) | Guide for contributors |
| [User Guide](docs/USER_GUIDE.md) | How to use the application |

### Project Structure

```
questive/
├── app/                    # Next.js App Router pages
│   ├── actions/           # Server actions (CRUD operations)
│   ├── api/               # API routes (auth)
│   └── dashboard/         # Protected dashboard pages
├── components/            # React components
│   ├── ai/               # AI feature components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── forms/            # Form components
│   ├── settings/         # Settings components
│   ├── taskboard/        # Task board components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions and configurations
│   └── ai/               # AI integrations (Gemini)
├── prisma/               # Database schema
├── docs/                 # Documentation
└── scripts/              # Development scripts
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

## License

This project is open source and available under the [MIT License](LICENSE).
