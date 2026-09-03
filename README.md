# Campus Ledger

Multi-tenant school management system. Architecture proposal and rationale live in the
`Campus Ledger Blueprint` artifact shared in-conversation. This repo is through Phase 08,
plus the Parent self-service module: JWT + refresh-token auth, the tenant-isolation layers
from §06, Super Admin school management (create/edit/activate schools, provision School
Admins), School Admin's own core setup — academic years, classes, sections, subjects,
teacher/student/parent/staff CRUD, and enrollment — Phase 03's attendance and timetable,
Phase 04's exams/marks/results, Phase 05's assignments/submissions, Phase 06's fee
structures/student fees/payments/receipts/expenses (the Accountant module), Phase 08's
read-only aggregate reports across every role plus Super Admin's per-school statistics,
Parent's "R (children)" view across all of it (§07), and an AI Assistant available to every
signed-in role — a persistent chat widget answering questions about the caller's own data and
how to use the app, grounded through the same tenant-scoped service layer as everything else.
The AI Assistant and the public school websites (`apps/school-site` — one independently
deployable app per school) are both genuinely new additions, not part of the original phase
plan in §11 — Phase 07 (notices, events, the notification queue) is the one phase still not
built.

## Stack

- **apps/web** — React 19 + TypeScript + Vite, React Router, Redux Toolkit + RTK Query, Tailwind CSS v4
- **apps/api** — Node + TypeScript + Express, PostgreSQL via Prisma, JWT + refresh-token auth,
  the `openai` SDK pointed at Groq's OpenAI-compatible API (`openai/gpt-oss-120b`) for the
  AI Assistant — the same `GROQ_API_KEY` already used by the dummy audio-to-text page
- **apps/school-site** — React 19 + TypeScript + Vite, Tailwind CSS v4, no Redux/RTK Query (one
  read-only payload, no need for a data-fetching library). A separate, independently-deployable
  public website app — **not part of the phase plan in §11**, added on request. One instance is
  meant to run per school (its own process/port/host), reading that one school's published
  content from the same shared `apps/api` backend everyone else uses, through a single
  unauthenticated endpoint. See "Public school websites" below.
- **packages/shared-types** — `Role` and API envelope types shared across all three apps
- **packages/validation-schemas** — Zod schemas shared by API validation and frontend forms

## Prerequisites

- Node 20+, pnpm 10+
- [Doppler CLI](https://docs.doppler.com/docs/install-cli), logged in and with access to the
  `campus-ledger` project's `dev` config — this is the source of truth for local secrets
  (`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `VITE_API_URL`, ...), not `.env` files.
  `DATABASE_URL` points at a hosted Neon Postgres and `REDIS_URL` at hosted Upstash Redis —
  nothing to run locally for either.
- A `GROQ_API_KEY` (from https://console.groq.com/keys), added to the same Doppler `dev`
  config, to power the AI Assistant (and the dummy audio-to-text page, which already used
  it). The app boots fine without it — `POST /api/v1/assistant/chat` just returns a clear
  `MISSING_API_KEY` error until it's set.

`apps/api/.env.example` / `apps/web/.env.example` still exist as a fallback for anyone working
without Doppler access — copy them to `.env` and every script below still works unchanged,
since Doppler-injected vars simply take precedence when present.

## Setup

```bash
pnpm install
doppler setup --project campus-ledger --config dev   # scopes this directory, once per machine

pnpm prisma:deploy                                     # applies migrations to the Doppler-configured DB
pnpm prisma:generate
doppler run -- pnpm --filter @campus-ledger/api prisma:seed   # creates the one SUPER_ADMIN — see its printed password
```

## Run

```bash
pnpm dev:api    # doppler run -- ... → http://localhost:4000
pnpm dev:web    # doppler run -- ... → http://localhost:5173
```

Open http://localhost:5173 and sign in with the Super Admin the seed script printed. From
there: create a school, provision its first School Admin (the temp password is shown once,
right in the UI), then sign in as that admin in a second browser/profile to see the tenant
boundary hold — they can only ever see their own school's data, by id or by listing.

Signed in as that School Admin, the dashboard walks through Phase 02's own setup in order:
create and activate an academic year, add a class and a section inside it (optionally with
a class teacher), add a subject, provision teachers/students/parents/staff (each shows a
one-time temp password the same way School Admin creation does), link parents to their
children, then enroll a student into a section for the active year from the Enrollment tab.

From School Admin's Timetable tab, build the weekly schedule for a section: pick a subject,
a teacher, a day and a time — the same screen catches double-booking a teacher or a section
into overlapping slots.

From School Admin's Exams tab: create an exam, add a subject/section pairing to it (with
max/pass marks and a date), then either enter marks yourself or let the subject's Teacher do
it. Assignments are read-only for School Admin (§07 gives them "R", not "Manage") — Teachers
own that module entirely.

Put a Teacher on the timetable for a subject+section (Timetable tab, or the class-teacher
field on a Section) before expecting them to see it anywhere else — every Phase 04/05
ownership check (marks entry, assignment creation) is decided by that same TimetableSlot,
not a separate assignment table.

Sign in as one of the students created above (using its printed temp password) to see the
Student self-service area at `/student` — architecture §07's "R (self)" scope: their own
profile and enrollment history (`GET /api/v1/me/student`), a read-only subjects list, their
own weekly timetable, their own attendance history with a running summary, their own results
across every exam (`GET /api/v1/me/results` — the report card), and the assignments posted
for their section, each with a submit/resubmit box (`GET`/`POST /api/v1/me/assignments`).

Sign in as a teacher you assigned as a section's class teacher to see the Teacher
self-service area at `/teacher` — §07's "R (own)"/"CRU (own subject)"/"Manage (own)" scope:
their own profile and roster (`GET /api/v1/me/teacher`), their own timetable, the Mark
Attendance screen (pick a date, mark each roster student, re-marking the same date updates
in place rather than duplicating), Enter Marks (same shape, against whichever exam subjects
they actually teach — `GET /api/v1/me/exam-subjects`), and Assignments (post one for a
subject/section they teach, then grade each student's submission). Every one of these is
ownership-checked server-side — a Teacher hitting another teacher's section, subject, or
assignment gets a 403, not just a route-level role gate.

Link a parent to that same student (School Admin's Parents tab already does this) and sign in
as them to see the Parent self-service area at `/parent` — §07's "R (children)" scope. It's
literally the same five reads a Student gets for themselves (profile/enrollment, attendance,
timetable, results, assignments), fanned out across every linked child instead of hardcoded
to the caller — `GET /api/v1/me/children` lists them, and every `/me/children/:studentId/*`
route re-runs the exact same service function a Student's own `/me/*` route calls, after
checking a `ParentStudent` link actually exists between that parent and that student. A
parent with more than one child gets a switcher on every screen; hitting a child that isn't
theirs is a 403, not a 404 — same "don't leak existence" question §06 answers differently for
cross-tenant lookups, but this is same-tenant ownership, so a plain 403 is honest here.

Sign in as a School Admin-provisioned Accountant (or as School Admin themselves — §07 gives
them the same "Manage" scope here) to see `/accountant` — Fee Structures builds a fee plan
for a class within an academic year, adds it line items (tuition, transport, ...), and
"Generate charges" turns one line item into a `StudentFee` charge for every student actively
enrolled in that class, skipping anyone already charged; Student Fees browses those charges
and records a payment against one — offline/manual only (§12: no live gateway in scope for
v1), and every payment issues a receipt automatically in the same transaction. Recording a
payment requires an `Idempotency-Key` header (§08) — the frontend generates one per form
open, so a retried click can't double-charge a fee. Expenses is the one place School Admin's
scope narrows below the Accountant's: they get "R", Accountant gets "Manage". Student sees
their own charges read-only at `/student/fees` (`GET /api/v1/me/fees`); Parent sees the same
per linked child at `/parent/fees`.

Every signed-in role gets the AI Assistant — a chat button in the bottom-right corner of
every screen (`AssistantWidget`, mounted once in `RequireAuth` rather than per-layout, so it's
there even for STAFF, which has no dashboard of its own yet). Ask it about your own data
("what's my attendance this month", "who's overdue on fees") or how to do something in the
app ("where do I generate fee charges") and it answers by calling the same tenant-scoped
service functions every REST route already uses — `POST /api/v1/assistant/chat` streams the
reply as newline-delimited JSON so the widget can render it as it's produced. A Parent asking
about a child that isn't actually linked to them gets refused by the same `assertParentOfStudent`
check `/me/children/:studentId/*` already enforces — there's no separate, weaker "assistant
data access" path. No conversation history is persisted server-side (v1 scope, §12-style) —
each browser tab's chat lives only as long as the tab does.

Phase 08 (§11) adds read-only aggregate reports, one endpoint per §07's Reports row, all pure
computation over data the earlier phases already collect — no new tables. Super Admin gets
`/super-admin/reports` (platform-wide: people counts, schools onboarded per month, top schools
by enrollment) and a "Statistics" section on each school's own detail page (`GET
/api/v1/reports/schools/:schoolId`) — counts and totals only, never a roster; that stays behind
the school's own tenant boundary same as always. School Admin gets `/school-admin/reports`
(enrollment by class, attendance rate, exam pass rate, fee collection — their own school, and
the same financial scope Phase 06 already shares with Accountant). Teacher gets
`/teacher/reports` (attendance and average marks, scoped to sections they're class teacher of
and subjects they actually teach, via the same `TimetableSlot` ownership check every other
Phase 03/04 route uses). Accountant gets `/accountant/reports` (collection and expenses by
month, expenses by category). Student, Parent and Staff get no Reports scope — their own
`/me/*` reads already answer "how am I doing."

### Public school websites

Not part of §11's phase plan — added on request, and architecturally different from
everything above it: a normal, public, signed-out-visitor website per school, deliberately
**not** another page inside the multi-tenant `apps/web` app. `apps/school-site` is its own
small app, meant to be deployed independently **once per school** (its own process, its own
port/host — genuinely separate, not path-routing inside one server), configured entirely
through env vars (`VITE_SCHOOL_SLUG`, `VITE_API_URL`) rather than a per-school build. Every
deployment still reads from the one shared Postgres database everyone else in this repo uses
— tenant-scoped, exactly like every other tenant table — through one new unauthenticated
endpoint, `GET /api/v1/public/schools/:slug`, which explicitly filters by school id rather
than leaning on tenant-context scoping (there's no caller identity for an anonymous request
to scope against, §06). CORS for that one route is wide open by design (any origin, no
credentials) since a school-site deployment's own host/port is never known in advance —
handled by a single per-path dynamic `cors()` in `app.ts`, not a second CORS middleware, since
the global one would otherwise answer (and kill) the preflight before a route-scoped one ever
ran.

School Admin manages the content from inside the normal app — a new "Website" tab
(`/school-admin/website`) edits tagline/about/admissions/contact/a hex theme color and
announcements (`school-website` module), with a Publish/Unpublish toggle; nothing is public
until published. Beyond those scalar fields, the same page edits a philosophy/leadership
message (with an optional portrait image URL) and four small repeatable lists — key-number
stat counters, achievement/highlight cards, program/stage cards, and campuses — each capped
at 12 rows, stored as plain `Json` columns on `SchoolWebsite` (a real relational table would
be overkill for lists this small and always edited as a set; that's what `Announcements`
stays its own table for). In the editor these are react-hook-form `useFieldArray`s, not
separate component state, so add/remove/save all go through the form's one `reset()`/submit
cycle instead of a second state-sync mechanism. The public template
(`apps/school-site/src/pages/HomePage.tsx`, and a shorter version on `AboutPage.tsx`) renders
each section only when a school has actually filled it in — a navy/teal institutional palette
(`--color-navy`/`--color-teal`/`--color-gold` in `index.css`, independent of a school's own
`themeColor` accent), a scrolling announcement ticker + contact utility bar above the main
nav (`SiteLayout.tsx`), a stats band, the philosophy quote block, the achievements grid,
program cards, and a campuses list, closing on an admissions CTA band. Run a public instance
against a published school:

```bash
cd apps/school-site
cp .env.example .env   # set VITE_SCHOOL_SLUG to a real School.slug
pnpm install
PORT=5322 pnpm dev     # → http://localhost:5322/<slug>
```

Run a second instance for a second school on another port (`PORT=5332 VITE_SCHOOL_SLUG=<other
slug> pnpm dev`) to see two schools' sites running as genuinely independent processes at once,
each with its own theme color applied at runtime (`lib/theme.ts` picks readable text off the
school's own hex automatically) — the scenario this feature was built for.

Every other Student/Teacher/Parent-facing module in §07 (notices) is Phase 07+ and not built
yet, so none of it is faked here.

`/status` still has the Phase 00 API+DB health check (also surfaces whether the API process
is Doppler-fed or running off a plain `.env`).

## Tests

```bash
doppler run -- pnpm --filter @campus-ledger/api test
```

Runs the tenant-isolation suite in `apps/api/src/__tests__` against the real dev database:
two schools, two School Admins, and the specific attack the architecture doc calls out — one
school's admin trying to read the other's data by guessing an id. It also runs the Phase 02
end-to-end suite (`school-admin-core.test.ts`) — one School Admin standing up a fully staffed,
fully enrolled school — and the Phase 06 suite (`phase06-fees-expenses.test.ts`): an
Accountant generating student fees, recording a payment idempotently (a retried request with
the same `Idempotency-Key` never double-charges), issuing a receipt, and Expenses' School
Admin/Accountant split, plus the same cross-tenant 404 check. Test fixtures clean themselves
up in `afterAll`.

## Status

Through Phase 08 (auth, tenant isolation, Super Admin school management, School Admin core
setup, attendance and timetable, exams/marks/results, assignments/submissions, fee
structures/student fees/payments/receipts/expenses — the Accountant module — and read-only
aggregate reports across every role plus Super Admin per-school statistics), plus Parent
self-service (§07's "R (children)" across all of the above), the AI Assistant, and public
school websites via `apps/school-site` (one independently deployable app per school — neither
in the original §11 phase plan) — see the blueprint's §11 for what's next (Phase 07:
notices, events, and the notification queue — the one phase in the original plan still not
built) and §12 for items still open (hosting target, an email provider so account creation
stops returning a password in the API response, and object storage for real file uploads —
assignment submissions are text only, and a Receipt's `pdfUrl` sits unused, until then). §12's
payment-gateway question is settled: Phase 06 is manual/offline payment recording only — no
Stripe/Razorpay integration.
