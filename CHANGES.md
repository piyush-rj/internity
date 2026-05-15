# Internity — frontend integration summary

A walkthrough of everything wired between the Next.js frontend (`apps/web`) and the existing backend API.

---

## What you can now do, end-to-end

### Public (no sign-in needed)

- Marketing landing at `/`
- View any company's public page at `/company/[slug]` (hero + open positions + recently closed)
- View any student's public profile at `/student/[userId]` (resume-style view)

### Student journey

- Sign in with Google → role gate prompts pick on first sign-in → choose **Student** → routed to profile
- Fill out **Profile** at `/home/profile`: basics, education, experience, projects, skills (with live autocomplete), certifications, languages. Completion percentage tracked in the wizard sidebar
- **Upload a resume** at `/home/resume` — drag-and-drop or click to upload (PDF, up to 10 MB) with live progress bar; replace or remove anytime
- Browse listings at `/home/internships` and `/home/jobs` with **full filters + search + pagination** (query, city, mode, skills, min stipend, max duration, part-time toggle); all state lives in the URL so filters are shareable / back-navigable
- **Save / unsave** any listing from any list view; saved state stays in sync across the app via a shared store
- Open a listing at `/home/listings/[id]` — full detail page with description / responsibilities / who-can-apply / perks / skill chips + sticky key-details rail
- **Apply** with optional cover letter; UI flips to "you've applied" after submit
- Track everything at `/home/applications` (status badge, withdraw)
- Review bookmarks at `/home/saved`
- **Dashboard** at `/home/dashboard` shows real Greeting + StatsRow (applications / saved / interviews / profile %) + ProfileCompletion (7 sections with deep links) + Recent applications + Recommended internships
- Settings at `/home/settings` — account card with role badge + profile chips + in-app sign-out

### Employer journey

- Sign in → role pick → choose **Employer** → routed to `/home/employer/setup` (two-step: employer profile → company)
- Once onboarded, **dashboard** at `/home/dashboard` shows employer-flavored Greeting + StatsRow (open listings / total / applicants / team) + MyListingsWidget + CompanySnapshot + "Post a new listing" CTA
- **Manage listings** at `/home/manage-listings` (list with status / applicants count, close / reopen / delete actions)
- **Post a new listing** at `/home/manage-listings/new` (full form: basics + description + responsibilities/perks/preferences/skills + compensation/timing)
- **Applicants** at `/home/applicants?listingId=...` — listing picker + applicant cards with inline status dropdown (Applied → Shortlisted → Interview → Hired / Rejected), expandable cover letter, link to public student profile
- **Company management** at `/home/company` — view/edit company info (owners only), invite by email, change member roles, remove members, "View public page" link
- Settings at `/home/settings` — account card + employer profile edit + sign-out

### Cross-cutting

- Role-aware sidebar — student nav (Dashboard / Internships / Jobs / Applications / Saved / Resume / Profile / Settings) vs employer nav (Dashboard / My listings / Applicants / Company / Settings)
- Role-aware Topbar — search box submits to `/home/internships?q=…`; primary CTA is "Post listing" for employers, hidden for students
- Breadcrumbs in Topbar follow the URL (`Home > Manage Listings > New`), with kebab/underscore-aware prettifier; "Home" anchors to `/home/dashboard`
- `RoleGate` redirects new users to the right onboarding entry; employers without a company are kept on the setup page until they finish; once the user picks, the picker dismisses immediately (no race with `me` refetch)
- `MeBootstrap` + `SavedBootstrap` prefetch `/auth/me` and saved listings once at layout mount; every component reads from the shared stores

---

## Backend endpoints currently wired

| Module          | Endpoint                                                         | Where it's used                                                                         |
| --------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **auth**        | `me()`                                                           | `useMeStore` → MeBootstrap, Sidebar role-routing, RoleGate, Settings, Topbar CTA        |
| **auth**        | `set_role()`                                                     | RolePicker                                                                              |
| **student**     | `get_me()`                                                       | `useMyProfile` → profile page, ProfileCompletion, Greeting, StatsRow, Resume page       |
| **student**     | `create()` / `update()`                                          | BasicsForm, Resume page (`resumeUrl` patch + clear)                                     |
| **student**     | `get_public(userId)`                                             | `/student/[userId]` (refined return type to include `user`)                             |
| **student**     | `add/update/remove_education`                                    | EducationSection                                                                        |
| **student**     | `add/update/remove_experience`                                   | ExperienceSection                                                                       |
| **student**     | `add/update/remove_project`                                      | ProjectsSection                                                                         |
| **student**     | `add/remove_skill`                                               | SkillsSection                                                                           |
| **student**     | `add/update/remove_certification`                                | CertificationsSection                                                                   |
| **student**     | `add/update/remove_language`                                     | LanguagesSection                                                                        |
| **employer**    | `get_me()`                                                       | `useMyEmployer` → setup, manage-listings/new, company page, dashboard widgets, settings |
| **employer**    | `create()`                                                       | Employer setup step 1                                                                   |
| **employer**    | `update()`                                                       | EmployerProfileCard on Settings                                                         |
| **company**     | `create()`                                                       | Employer setup step 2                                                                   |
| **company**     | `get_by_slug()`                                                  | `/company/[slug]` (refined return type to `Listing[]`)                                  |
| **company**     | `update()`                                                       | CompanyInfoCard inline edit                                                             |
| **company**     | `list_members / add_member / update_member_role / remove_member` | MembersCard                                                                             |
| **listing**     | `list()`                                                         | `useListings` → internships + jobs (with full filter set), RecommendedInternships       |
| **listing**     | `list_mine()`                                                    | `useMyListings` → manage-listings, applicants picker, employer dashboard widgets        |
| **listing**     | `get(id)`                                                        | `useListing` → listing detail page                                                      |
| **listing**     | `create()`                                                       | ListingForm                                                                             |
| **listing**     | `close / reopen / remove`                                        | MyListingCard inline actions                                                            |
| **listing**     | `apply()`                                                        | ApplyCard on listing detail                                                             |
| **listing**     | `list_applicants()`                                              | `useListingApplicants` (refined return type to `ApplicantWithStudent[]`)                |
| **application** | `list_mine()`                                                    | `useMyApplications` → /home/applications, dashboard widget, StatsRow                    |
| **application** | `withdraw()`                                                     | ApplicationCard trash button                                                            |
| **application** | `update_status()`                                                | ApplicantCard status dropdown                                                           |
| **saved**       | `list / save / unsave`                                           | `useSavedStore` → ListingCard save button, /home/saved page                             |
| **skill**       | `autocomplete(q)`                                                | SkillsSection combobox                                                                  |
| **upload**      | `sign() + confirm()`                                             | `/home/resume` (presigned-URL PUT + XHR progress)                                       |

---

## What was created or significantly changed

### New routes

- `/home/employer/setup` — two-step onboarding
- `/home/manage-listings` + `/home/manage-listings/new` — listings CRUD
- `/home/applicants` — applicants view (with listing-picker query param)
- `/home/company` — company info + members
- `/home/resume` — real resume upload (PDF, drag-and-drop, progress, replace/remove)
- `/company/[slug]` — public company page
- `/student/[userId]` — public student profile
- `/home/listings/[id]` — public listing detail (Next 16 `params` with `use()`)

### New stores (Zustand)

- `useMeStore` — caches `/auth/me`, populated by `MeBootstrap`
- `useSavedStore` — saved listings + optimistic save/unsave; `useIsSaved(id)` selector
- (preexisting) `useUserSessionStore` for NextAuth session

### New hooks

- `useMe`, `useMyEmployer`, `useMyListings`, `useMyApplications`, `useListing`, `useListingApplicants`, `useCompanyMembers`
- Preexisting: `useMyProfile`, `useListings`

### New components

- **Dashboard glue**: `MeBootstrap`, `SavedBootstrap`, `RoleGate`, `RolePicker`, `EmployerDashboard`, `EmployerStatsRow`, `MyListingsWidget`, `CompanySnapshot`
- **Student listings**: `ListingCard` (save toggle wired), `ListingList`, `ListingsFilters`, `PaginationBar`, `ListingDetail`, `ApplyCard`, `filtersFromSearchParams` helper
- **Student applications**: `ApplicationCard`, `ApplicationsList`
- **Employer listings**: `MyListingCard`, `ListingForm`
- **Applicants**: `ApplicantCard`
- **Company**: `CompanyInfoCard`, `MembersCard`
- **Settings**: `EmployerProfileCard`

### Refactors / improvements

- Promoted `useMe` from a per-component fetch to a shared `useMeStore` + `MeBootstrap`
- Made `Sidebar` role-aware (single source of truth via `useMeStore.me.role`)
- Made `Topbar` role-aware (search submits to `/home/internships?q=…`; primary CTA shows "Post listing" for employers only); breadcrumbs redone to mirror the actual URL with prettified labels; "Home" anchors to `/home/dashboard`; misleading bell unread-dot removed
- `UserMenu` (marketing nav) — replaced seven mostly-dead links with five real `/home/*` destinations (Dashboard / My applications / Saved / Profile / Settings); added a small `UserIcon` to `base/icons.tsx`
- `ProfileCompletion` widget switched from hardcoded steps to `computeCompletion(profile)` from the wizard utils, with deep links to each section
- `StatsRow` switched from mock numbers to real data (applications / saved / interviews / profile %)
- Dashboard `Applications` widget switched from mock to real `useMyApplications`
- `SkillsSection` autocomplete combobox: 200 ms debounce, keyboard nav, "Add new: X" fallback when the typed value isn't a known skill; later hardened against an infinite-loop bug by moving `addedNames` into a ref and making the empty-suggestions clear idempotent
- `RoleGate` resilience pass: dismisses the picker immediately on selection (no flash-back while `me` refetches), self-disables on `/home/profile` for students mid-setup, and on `/home/employer/setup` for employers
- Google sign-in `callbackUrl` switched from `/` to `/home/dashboard` so the role gate actually fires on first sign-in
- **Type tightening**:
    - `listingApi.list_applicants`: `unknown[]` → `ApplicantWithStudent[]`
    - `companyApi.get_by_slug`: `unknown[]` → `Listing[]`
    - `studentApi.get_public`: `StudentProfile` → `PublicStudentProfile` (includes `user`)
    - `StudentProfileInput` extended with `resumeUrl?: string | null` (used by the resume page to patch / clear)
- Barrel `lib/api/index.ts` re-exports all `*Input` types, `ListingListFilters`, `ApplicantWithStudent`, `PublicStudentProfile`, etc. — fixed ~19 pre-existing type errors
- `ProfileHeaderCard` got `editTrigger` prop so the sidebar's "Basics" tab can open the inline form; section id renamed `profile-basics` → `profile-summary`; added `summary` step to wizard utils

### Cleanups / removals

- Removed `OngoingTrainings` widget + file (no backend)
- Removed `/home/trainings` route entirely
- Removed "Trainings" item from student sidebar
- Removed old `/dashboard/profile/new` flow (the new structure lives entirely under `/home`)

### TypeScript status

- Whole-app `tsc --noEmit` is clean.

---

## What's still NOT wired

- `uploadApi` for `COMPANY_LOGO` and `PROFILE_IMAGE` — the upload plumbing is built and proven via the resume flow, but neither `CompanyInfoCard` nor `BasicsForm` has an image picker yet. Companies / students can paste a logo URL but can't upload directly.
- Nothing else on the API surface is un-wired. Every endpoint listed in `apps/web/src/lib/api/` has a real frontend.

---

## Known polish items (no backend gap, just rough edges)

- Mobile responsiveness pass — sidebar collapse, topbar fit, modal sizing on phones
- `Greeting` widget still shows a fake "12% more visible this week" pill
- Loading-skeleton patterns vary slightly across pages; could be unified
- `/company/[slug]` and `/student/[userId]` are public-intent but the API client always sends the Bearer token if present — works for signed-in viewers; behavior for fully-unauthenticated visitors depends on backend allowing those routes without auth

---

## Update — post-MVP polish, new features (May 2026)

### New features

- **Notification system (end-to-end)**
    - **Schema**: new `Notification` model + `NotificationType` enum (`APPLICATION_RECEIVED`, `APPLICATION_STATUS_CHANGED`, `APPLICATION_WITHDRAWN`, `LISTING_CLOSED`, `COMPANY_MEMBER_ADDED`, `GENERIC`); reverse relation on `User`. Migration `20260514220422_add_notifications` applied.
    - **Server**: `notify()` / `notifyMany()` helpers in `services/service.notification.ts` that never throw (so a notification failure can't roll back the real mutation). New `controller.notification.ts` + `routes.notification.ts` exposing `GET /notification`, `PATCH /notification/:id/read`, `POST /notification/read-all` (all auth-gated). Triggers wired into `application.apply` (notify every company member) and `application.update_status` (notify the student with formatted status name).
    - **Frontend**: `notificationApi` client, `useNotifications()` hook (30 s polling + on tab refocus, optimistic mark-read with rollback), and `NotificationPanel` popover anchored to the Topbar bell — unread count badge (orange "9+" style), type-specific icons, unread tinting, "Mark all read", empty + loading states. Replaces the previous static `IconBtn` bell.

- **Razorpay payment gateway (test-mode-ready)**
    - **Server**: `razorpay` SDK installed. New `controller.payment.ts` exposes `POST /payment/order` (creates a Razorpay order from amount in paise + currency, returns `orderId / amount / currency / keyId`) and `POST /payment/verify` (HMAC-SHA256 verifies the `order_id|payment_id` signature against `RAZORPAY_KEY_SECRET`). Mounted at `/payment`.
    - **Frontend**: `paymentApi` client + `openCheckout()` helper in `lib/razorpay.ts` that lazily injects the Razorpay checkout script, creates the order via the server, opens the modal with brand theme, then POSTs the response to `/payment/verify`. The Sidebar's old "Buy Plan" anchor is now an interactive `UpgradeCard` ("Buy Plan · ₹499" → "Opening…" → "You're on Pro" on success), prefilled with the user's name/email.
    - **Env**: requires `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in `apps/server/.env`. Gracefully degrades to a clear error message if missing.

- **Multi-field search + ⌘K**
    - Topbar searchbar now opens a clean suggestion dropdown as the user types (debounced 200 ms, min 2 chars, request-id race-guard). Each suggestion shows company logo + role title + company name · city. Clicking navigates to the listing; Enter (or the footer "See all results" button) goes to `/home/internships?q=…`. Click-outside / Escape closes; auto-closes on route change.
    - Server's `q` param now searches across `title`, `company.name`, AND `skillTagsRaw` (OR'd) — was previously title-only.
    - `⌘K` / `Ctrl+K` globally focuses + selects the searchbar; a `<kbd>` hint chip shows the shortcut inline (platform-aware after mount to avoid hydration mismatch).

- **Resume visible on public student profile**
    - `controller.profile.ts get_public_profile` now includes `user: { id, name, email, image }` so the page no longer crashes on `profile.user.image`.
    - `/student/[userId]` now renders a "Resume" section right after the Hero (View resume link, opens `resumeUrl` in a new tab) — employers can finally see the applicant's resume from the applicants list.

- **Employer Approve / Reject actions**
    - `ApplicantCard` now has explicit Approve (→ SHORTLISTED) and Reject (→ REJECTED) buttons next to "View profile". They hide once the application is in a terminal state (`HIRED`, `REJECTED`, `WITHDRAWN`).

### UI redesign — dashboard + tables

- **Dashboard page wrappers** (student + employer) now sit on a `BackgroundDecor` layer: faint 135° diagonal lines (~2.5% black) + warm orange radial glow top-right + soft indigo wash bottom-left. Cards float over it with `bg-card/90 backdrop-blur-sm shadow-xs` and a hover shadow upgrade.

- **StatsRow** (student + new `EmployerStatsRow`) — replaced the four big outlined cards with a compact row of cards: large circular icon badge on the left (with a small orange / rose / zinc directional badge in its top-right showing up / down / flat delta), then label (uppercase, tracking-wide), big value, and a one-line caption. Hover adds a ring (no translate). Neutral icon tint across all four; semantic color reserved for the delta dot and the unread / status pills.

- **Lists turned into tables** (`ListingList`, `ApplicationsList`) — replaced the row-card pattern with a real `<table>`: column headers with leading icons (ROLE, COMPANY, MODE, STIPEND, DURATION, LOCATION, POSTED for listings; ROLE, COMPANY, STATUS, MODE, APPLIED for applications), `divide-x divide-border` on every row for vertical column dividers, `divide-y` between rows, status/mode pills are rounded-full with a colored dot prefix, sky for APPLIED / amber for SHORTLISTED / violet for INTERVIEW / emerald for HIRED / rose for REJECTED, emerald for Remote / amber for Hybrid / sky for On-site. Section wrappers cast a small `shadow-xs` so they read as floating panels.

- **Compact list mode** — `ListingList` and `ApplicationsList` accept a `compact` prop. When set (used by the dashboard widgets only), they drop the trailing action column (Save / Withdraw), the Duration and Location columns on the listings table, tighten padding (`px-2.5 py-2.5`), and remove `overflow-x-auto` so the tables fit cleanly inside the 2/3-column dashboard layout without horizontal scroll. Full-width pages (`/home/internships`, `/jobs`, `/saved`, `/applications`) still show all columns.

- **Dashboard "feed" tab toggle** (`DashboardTabs`) — replaced the stacked `RecommendedInternships` + `Applications` sections with a pill-style toggle (Recommended / Applications). The active background is a sliding indicator (absolute element measured against the active tab's `offsetLeft / offsetWidth`, animated via `transition-[left,width] duration-300 ease-out`). A "see all …" link sits to the right of the toggle and routes to `/home/internships` or `/home/applications` depending on tab.

- **Standalone `ListHeader`** for list pages — the small "All jobs · 0 results" bar at the top of `/jobs`, `/applications`, `/saved`, `/internships` is now its own component (`apps/web/src/components/listings/ListHeader.tsx`) with `title`, `count`, `countLabel` (auto-pluralizes for "results"), `action`, `loading`. Sits standalone above the list with `mt-5` separation, instead of being embedded inside the list section's header slot.

- **Profile completion polish** — `ProfileCompletion` now uses an orange pill for the count, an orange progress bar with a "{N} left" inline nudge while incomplete, and step rows that slide a chevron right (`group-hover:translate-x-0.5`) on hover.

- **Employer dashboard** matches the student dashboard visually: same `StatCard` pattern (Open listings / Total listings / Applicants / Team), `MyListingsWidget` rewritten as a table (ROLE / STATUS / APPLICANTS / POSTED + chevron) with the `ListHeader` on top, and `CompanySnapshot` cards switched to the floating-glass aesthetic.

- **NavBar floating pill** — the landing-page navbar morphs into a Cal.com-style floating pill on scroll. Polished: gated behind a `floatOnScroll` prop (only `/` opts in; `/student/[userId]` and `/company/[slug]` keep the static navbar); `requestAnimationFrame`-throttled scroll listener; `transition` duration bumped to 500 ms with `cubic-bezier(0.22, 1, 0.36, 1)` easing; dropped the overspecified `will-change` hint.

- **Page-rail plus marks** — removed the misplaced standalone `<RailIntersection />` at the end of `<main>` (it was rendering at the top of the page because of `absolute top-0` resolving against `<main>`'s top, not the bottom). Section-divider `+` marks remain everywhere they're meant to.

### Bug fixes

- **`/home/employer/setup` "Invalid data"** — the company `website` field used `z.url()` which requires a scheme. The error path now is surfaced more obviously (still server-validated; client UX could be improved to auto-prepend `https://`).
- **Public student profile crash on `profile.user.image`** — server's `get_public_profile` wasn't including `user`. Fixed.
- **Employer applicants page crash on `student.user.name`** — same shape mismatch; addressed via the public-profile `user` include + types.

### Files added (highlights)

- `packages/database/prisma/migrations/20260514220422_add_notifications/`
- `apps/server/src/services/service.notification.ts`
- `apps/server/src/controllers/notification-controllers/controller.notification.ts`
- `apps/server/src/controllers/payment-controllers/controller.payment.ts`
- `apps/server/src/router/routes/routes.notification.ts`
- `apps/server/src/router/routes/routes.payment.ts`
- `apps/web/src/lib/api/notification.ts`
- `apps/web/src/lib/api/payment.ts`
- `apps/web/src/lib/razorpay.ts`
- `apps/web/src/hooks/useNotifications.ts`
- `apps/web/src/hooks/useListingSearch.ts`
- `apps/web/src/components/dashboard/NotificationPanel.tsx`
- `apps/web/src/components/dashboard/DashboardTabs.tsx`
- `apps/web/src/components/dashboard/EmployerDashboard.tsx` (rewritten)
- `apps/web/src/components/listings/ListHeader.tsx`

### Files removed

- `apps/web/src/components/listings/ListingCard.tsx` — folded into `ListingList`'s inline table rows. (The old `ApplicationCard.tsx` was slimmed to just type + `StatusBadge` exports.)

### Env additions

```
# apps/server/.env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```
