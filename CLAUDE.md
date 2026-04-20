# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # prisma generate && next build
npm run db:seed      # Seed specialties via tsx prisma/seed.ts
npx prisma migrate dev --name <name>   # Create and apply migration
npx prisma generate  # Regenerate client after schema changes
```

## Architecture

**Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma 7, PostgreSQL (Supabase), NextAuth v5 beta, Amplitude.

### Prisma 7 specifics
- Schema has **no `url`** in `datasource db` — connection is configured in `prisma.config.ts` via dotenv loading `.env.local`
- Client is generated to `src/generated/prisma/` (not `node_modules`) — import from `@/generated/prisma/client`
- Requires `@prisma/adapter-pg` + `pg` driver adapter — see `src/lib/prisma.ts`
- For `$transaction` callback typing use: `Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]` — do NOT import from `@/generated/prisma/internal/prismaNamespace` (not exported publicly)
- All API routes must have `export const dynamic = 'force-dynamic'` to prevent build-time prerendering

### Auth split (Edge Runtime constraint)
NextAuth is split into two files to avoid importing Node.js-only modules in the Edge Runtime:
- `src/lib/auth.config.ts` — Edge-safe config (no Prisma/bcrypt). Used by `src/middleware.ts`
- `src/lib/auth.ts` — Full config with `PrismaAdapter` + `Credentials` provider. Used by API routes and server components

The middleware imports only from `auth.config.ts`. Never import `auth.ts` from middleware.

### Role-based routing
Two roles: `PET_OWNER` and `VETERINARIAN`. Middleware in `src/middleware.ts` enforces:
- `/vet/*` → requires `VETERINARIAN`
- `/search`, `/book`, `/appointments`, `/dashboard` → requires `PET_OWNER`
- `/clinics/*` → accessible to both roles

### Availability → Slot flow
1. Vet saves weekly schedule (`AvailabilitySchedule`) via `POST /api/clinics/[clinicId]/availability`
2. That route calls `generateSlots()` from `src/lib/utils/slots.ts` which generates concrete `AvailabilitySlot` rows for the next 28 days using `createMany({ skipDuplicates: true })` keyed on `[clinicId, startsAt]`
3. Booking does an atomic `$transaction`: checks slot is free → marks `isBooked: true` → creates `Appointment`. Returns 409 on conflict.
4. Cancellation reverses `isBooked` back to `false`.

### Analytics (Amplitude)
- `src/lib/amplitude.ts` — `initAmplitude()`, `identify()`, `track()` helpers
- `src/components/AmplitudeProvider.tsx` — client component mounted in root layout; initializes Amplitude and calls `identify()` when session is available
- `src/components/TrackEvent.tsx` — fires a single `track()` on mount; used inside server component pages to emit events without converting the page to client
- Key funnel events: `search_performed` → `clinic_viewed` → `booking_started` → `booking_completed`

### Environment variables
Required in `.env.local` (never committed):
- `DATABASE_URL` — Supabase connection pooler URL (port 6543, not 5432 — direct port fails from Vercel due to IPv6)
- `NEXTAUTH_SECRET` — JWT signing key
- `NEXTAUTH_URL` — full app URL
- `NEXT_PUBLIC_AMPLITUDE_API_KEY` — Amplitude browser key
