# Expert Mobile Scheduler

Mobile installation scheduling platform for **Expert Mobile Communications** (Grande Prairie, AB).  
Three role-based dashboards: **Admin**, **Booker**, **Installer**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (CSS-first, `@theme {}` block) |
| Database | Neon PostgreSQL (serverless) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | Custom Jose JWT sessions — `em_session` HttpOnly cookie |
| 2FA | otplib v13 TOTP |
| Passwords | bcryptjs cost 12 |
| Email | Resend (optional — skipped if `RESEND_API_KEY` is absent) |
| UI Primitives | Radix UI + Lucide React icons |
| Validation | Zod v4 |
| Vehicle Data | NHTSA vPIC API with Prisma cache |
| Hosting | Vercel + Neon |

---

## Local Setup

### Prerequisites

- **Node.js ≥ 20** (tested on v24.15.0)
- **npm**
- A **Neon** project (free tier is fine)

### 1. Clone & Install

```bash
git clone <repo-url>
cd expertmobile-scheduler
npm install
```

### 2. Environment Variables

Create `.env` in the project root:

```env
# Neon — pooled URL (used at runtime)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.c-8.aws.neon.tech/neondb?sslmode=require"

# Neon — direct URL (used for Prisma migrations)
DIRECT_URL="postgresql://user:pass@ep-xxx.c-8.aws.neon.tech/neondb?sslmode=require"

# Random 32+ character secret for JWT signing
SESSION_SECRET="change-me-to-a-long-random-secret-value"

# Optional — omit to disable email sending
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
```

> **Neon tip:** The pooled URL host contains `-pooler`; the direct URL host does not.  
> Both are available in your Neon dashboard under **Connection Details**.

### 3. Generate Prisma Client & Run Migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Seed the Database

```bash
npm run seed
```

This creates:
- 2 admins, 5 bookers, 6 installers
- 10 services across all categories
- 36 customers with 72 vehicles
- 150 bookings spread over the past 30 days and next 14 days

**Default credentials:**

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin@Expert2024` |
| Booker | `aliciabergman` | `Booker@Expert2024` |
| Installer | `colemacpherson` | `Install@Expert2024` |

### 5. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

> **Windows note:** If `npm` is not in your PATH, use the included wrapper:
> ```
> dev.cmd
> ```

---

## Route Overview

```
/                    redirects to role dashboard or /login
/login               username + password (+ TOTP if enabled)
/first-login         forced password change on first login
/setup-2fa           optional TOTP enrollment

/admin               admin dashboard (stats, recent activity)
/admin/users         user management (create/edit/lock/reset)
/admin/services      service catalog (CRUD, toggle active)
/admin/schedule      admin calendar view by day
/admin/reports       revenue & booking stats
/admin/announcements announcement management
/admin/audit         paginated audit log

/booker              booker dashboard + announcements
/booker/new          5-step booking wizard
/booker/customers    customer list + create/edit
/booker/schedule     booker day-view schedule

/installer           my jobs (today + upcoming) + announcements
/installer/jobs/[id] job detail: status flow, photos, signature, notes
/installer/schedule  week view
/installer/profile   profile edit + time-off requests

/api/nhtsa/makes     GET ?type=pickup  — cached NHTSA vehicle makes
/api/nhtsa/models    GET ?makeId=&year= — cached NHTSA vehicle models
```

---

## Deploying to Vercel + Neon

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "initial commit"
git remote add origin https://github.com/your-org/expertmobile-scheduler.git
git push -u origin main
```

### 2. Import in Vercel

1. Go to vercel.com/new
2. Import the GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Add environment variables from your `.env` file
5. Deploy

### 3. Run Migrations on Neon

After the first deploy, run migrations against the production database:

```bash
DATABASE_URL="<your-direct-neon-url>" npx prisma migrate deploy
```

### 4. Seed Production (optional)

```bash
DATABASE_URL="<your-pooled-url>" npm run seed
```

---

## Email Setup (optional)

1. Create a Resend account at resend.com
2. Verify your sending domain (`expertmobile.ca`)
3. Create an API key and set `RESEND_API_KEY` in Vercel environment variables
4. Update the `FROM` address in `src/lib/email.ts` if needed

Without `RESEND_API_KEY`, all email functions silently no-op — the app works fully without it.

---

## 2FA Setup

Users can enable TOTP 2FA from `/setup-2fa` after logging in. They scan the QR code with an authenticator app (Google Authenticator, Authy, etc.). Once confirmed, every subsequent login requires the 6-digit code.

Admins can reset a user's 2FA via the Users management page.

---

## Password Policy

Passwords must be at least 12 characters with uppercase, lowercase, number, and symbol. Accounts lock after 5 consecutive failed login attempts. Admins can unlock accounts and reset passwords from the Users page.

---

## Development Notes

- `src/proxy.ts` is the route guard (replaces `middleware.ts` in this Next.js build)
- Prisma client lives at `src/generated/prisma/` — always import from `@/generated/prisma/client`
- Tailwind v4: all design tokens are in `src/app/globals.css` inside `@theme {}`; there is no `tailwind.config.ts`
- Server actions use individual typed parameters, not `FormData`
- Decimal fields from Prisma are serialized with `.toString()` before passing as props to client components
