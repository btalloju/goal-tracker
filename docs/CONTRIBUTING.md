# Contributing to Questive

Thank you for your interest in contributing to Questive! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please be respectful and constructive in all interactions.

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **Docker Desktop** for local PostgreSQL
- **Git** for version control
- A code editor (we recommend [VS Code](https://code.visualstudio.com/))

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/goal-tracker.git
   cd goal-tracker
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/btalloju/goal-tracker.git
   ```

### Environment Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Configure `.env.local`:**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/goaltracker"
   AUTH_SECRET="generate-with-openssl-rand-base64-32"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Start the database:**
   ```bash
   docker compose up -d
   ```

5. **Push the database schema:**
   ```bash
   npx prisma db push
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

### Google OAuth Setup (for local development)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google+ API
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Application type: Web application
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Secret to `.env.local`

---

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our [code style](#code-style)

3. **Test your changes:**
   ```bash
   npm run build    # Ensure it builds
   npm run lint     # Check for linting errors
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

**Examples:**
```
feat(goals): add priority filtering
fix(auth): resolve session expiration issue
docs(readme): update installation instructions
```

---

## Project Structure

```
goal-tracker/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Landing page
│   ├── actions/           # Server actions
│   │   ├── categories.ts  # Category CRUD
│   │   ├── goals.ts       # Goal CRUD
│   │   └── milestones.ts  # Milestone CRUD
│   ├── api/
│   │   └── auth/          # NextAuth API routes
│   └── dashboard/         # Protected pages
│       ├── layout.tsx     # Dashboard layout
│       ├── page.tsx       # Dashboard home
│       ├── categories/    # Category pages
│       └── goals/         # Goal pages
│
├── components/            # React components
│   ├── auth/             # Auth components (SignInButton, etc.)
│   ├── dashboard/        # Dashboard-specific components
│   ├── forms/            # Form components
│   └── ui/               # shadcn/ui components
│
├── lib/                  # Utilities and config
│   ├── auth.ts          # NextAuth configuration
│   ├── db.ts            # Prisma client
│   └── utils.ts         # Helper functions
│
├── prisma/
│   └── schema.prisma    # Database schema
│
├── types/               # TypeScript type definitions
│   └── next-auth.d.ts   # NextAuth type augmentation
│
└── docs/                # Documentation
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | NextAuth.js configuration with Google provider |
| `lib/db.ts` | Prisma client singleton |
| `middleware.ts` | Route protection (redirects unauthenticated users) |
| `prisma/schema.prisma` | Database models and relations |

---

## Code Style

### TypeScript

- Use TypeScript for all new files
- Define proper types; avoid `any`
- Use interfaces for object shapes

```typescript
// Good
interface Goal {
  id: string;
  title: string;
  status: GoalStatus;
}

// Avoid
const goal: any = { ... };
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks

```typescript
// Component file structure
"use client";  // Only if client-side interactivity needed

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

export function MyComponent({ title, onSubmit }: Props) {
  const [value, setValue] = useState("");

  return (
    // JSX
  );
}
```

### Server Actions

- Always validate user authentication
- Check resource ownership before mutations
- Return typed responses

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createCategory(data: { name: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return db.category.create({
    data: {
      name: data.name,
      userId: session.user.id,
    },
  });
}
```

### Styling

- Use Tailwind CSS utility classes
- Follow the existing shadcn/ui patterns
- Use CSS variables for theming (defined in `globals.css`)

```tsx
// Good - Tailwind utilities
<div className="flex items-center gap-4 p-4 rounded-lg bg-muted">

// Avoid - inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

### Imports

Order imports as follows:
1. React/Next.js imports
2. Third-party libraries
3. Local components (`@/components/`)
4. Local utilities (`@/lib/`)
5. Types

```typescript
import { useState } from "react";
import { useRouter } from "next/navigation";

import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

import type { Goal } from "@prisma/client";
```

---

## Submitting Changes

### Pull Request Process

1. **Update your branch:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub with:
   - Clear title following commit conventions
   - Description of changes
   - Screenshots for UI changes
   - Link to related issues

### PR Checklist

- [ ] Code follows the project style guidelines
- [ ] Changes build without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] New features have appropriate types
- [ ] Documentation updated if needed

### Review Process

- A maintainer will review your PR
- Address any requested changes
- Once approved, your PR will be merged

---

## Reporting Issues

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/OS information

### Feature Requests

Include:
- Clear description of the feature
- Use case / problem it solves
- Proposed implementation (optional)
- Mockups if applicable

---

## Questions?

Feel free to open an issue for any questions about contributing. We're happy to help!
