# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**MyNeto** - Hebrew RTL personal finance management app built with Next.js 16, TypeScript, Tailwind CSS v4, Prisma ORM, and NextAuth.

## Development Commands
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production (runs prisma generate first)
npm run lint         # Run ESLint
npx prisma db push   # Sync schema changes to database (REQUIRED after schema.prisma changes)
npx prisma generate  # Regenerate Prisma client
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16.1.1 with App Router & Turbopack
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Auth**: NextAuth.js with Google OAuth, JWT sessions
- **Styling**: Tailwind CSS v4 with custom design system in `globals.css`
- **AI**: OpenAI API (gpt-4o) for transaction classification and column mapping

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/` - REST API endpoints (all require auth via `requireAuth()`)
- `src/components/` - React components (mostly client components)
- `src/lib/` - Shared utilities, types, and business logic
- `prisma/schema.prisma` - Database schema

### Critical Patterns

**Environment Variables**: Centralized in `src/lib/config.ts` which validates all required env vars at startup. This file **cannot** be imported in client components (will throw error about missing env vars).

**Authentication Flow**:
1. `src/lib/auth.ts` - NextAuth configuration (server-only)
2. `src/lib/authHelpers.ts` - `requireAuth()` for API routes
3. `src/lib/adminHelpers.ts` - `requireAdmin()` for admin routes (server-only, don't import in client components)

**API Route Pattern**: All routes in `src/app/api/` follow this structure:
```typescript
import { requireAuth } from '@/lib/authHelpers';
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;
  // ... business logic
}
```

**Custom Categories**: Users can create custom categories. Always pass `customCategories` to `getCategoryInfo()` from `src/lib/categories.ts`.

### Database
- Schema in `prisma/schema.prisma`
- After schema changes: run `npx prisma db push` locally AND ensure Vercel deployment syncs
- Key models: User, Transaction, RecurringTransaction, Asset, Liability, Holding, UserProfile

### Security
- All API routes protected by `requireAuth()` or `requireAdmin()`
- CSRF protection via custom header validation
- Rate limiting with Upstash Redis
- Sensitive user profile fields encrypted with AES-256 (see `src/lib/encryption.ts`)
- Admin emails configured via `ADMIN_EMAILS` env var

## RTL & Hebrew UI
- All UI text is in Hebrew
- Use logical Tailwind properties: `ps-`/`pe-` instead of `pl-`/`pr-`, `start-0` instead of `left-0`
- Direction set globally in `globals.css`: `html { direction: rtl; }`

## Design System
- Colors: Indigo-600 primary, Emerald-500 income/positive, Rose-500 expense/negative
- Modal pattern: Use `modal-overlay` and `modal-content` classes from `globals.css`
- Cards: Use `Card` component from `src/components/ui/Card.tsx`
- Forms: Use `input`, `select`, `label` classes from `globals.css`

## Common Pitfalls
1. **Client importing server modules**: Don't import `adminHelpers.ts`, `auth.ts`, or `config.ts` in client components
2. **Missing custom categories**: Always pass custom categories to `getCategoryInfo()` when displaying transactions
3. **Schema out of sync**: After adding fields to `schema.prisma`, run `npx prisma db push`
4. **Modals clipped**: Use React Portal (`createPortal`) for dropdowns inside modals to avoid z-index issues
