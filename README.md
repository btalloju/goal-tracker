# Questive

Your life goals, intelligently prioritized. Questive transforms overwhelming life goals into an achievable daily practice by helping you prioritize what matters, break down ambitious dreams into actionable steps, and maintain sustainable momentum without burnout.

**Live Demo:** [goal-tracker-ivory-eight.vercel.app](https://goal-tracker-ivory-eight.vercel.app)

## Features

- **Google Authentication** - Secure sign-in with your Google account
- **Categories** - Organize goals by life areas (Health, Career, Personal, etc.)
- **Goals** - Create goals with priorities, target dates, and status tracking
- **Milestones** - Break down goals into actionable milestones with due dates
- **Task Board** - Daily task management with goal integration
- **Progress Tracking** - Visual progress indicators and completion rates
- **Theme Support** - Light, dark, and system themes
- **Mobile Responsive** - Works seamlessly on desktop and mobile devices

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or higher
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local development)
- [Google Cloud Console](https://console.cloud.google.com/) account (for OAuth)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/btalloju/goal-tracker.git
   cd goal-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your credentials:
   - `DATABASE_URL` - Local PostgreSQL connection string (pre-configured for Docker)
   - `AUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

4. **Start the database**
   ```bash
   docker compose up -d
   ```

5. **Push the database schema**
   ```bash
   npx prisma db push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Using the Setup Script

Alternatively, run the automated setup:
```bash
./scripts/dev-setup.sh
npm run dev
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, and security |
| [Contributing](docs/CONTRIBUTING.md) | Guide for contributors |
| [User Guide](docs/USER_GUIDE.md) | How to use the application |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Database | [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/) |
| ORM | [Prisma](https://www.prisma.io/) |
| Authentication | [NextAuth.js v5](https://authjs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Deployment | [Vercel](https://vercel.com/) (Singapore region) |

## Project Structure

```
questive/
├── app/                    # Next.js App Router pages
│   ├── actions/           # Server actions (CRUD operations)
│   ├── api/               # API routes (auth)
│   └── dashboard/         # Protected dashboard pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── forms/            # Form components
│   ├── settings/         # Settings components
│   ├── taskboard/        # Task board components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions and configurations
├── prisma/               # Database schema
├── docs/                 # Documentation
└── scripts/              # Development scripts
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details on:

- Setting up the development environment
- Code style and conventions
- Submitting pull requests
- Reporting issues

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Vercel](https://vercel.com/) for hosting and deployment
- [Neon](https://neon.tech/) for serverless PostgreSQL
