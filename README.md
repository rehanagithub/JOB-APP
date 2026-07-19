# Bridge — Job Portal

A full-stack job/internship portal covering both flows from your diagrams:
- **Employer/Hiring Manager flow**: register → verify company → post job → share & track source →
  applications dashboard with AI fit scoring → evaluate/message/hire → analytics → nudges & repost.
- **Candidate flow**: register → build profile → browse/filter jobs → apply → track status →
  explore extra tools.

Stack: **React (Vite + Tailwind)** frontend, **Node.js/Express** backend, **Supabase** (Postgres + Auth) database.

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → Run.
   This creates all tables, indexes, Row Level Security policies, and a trigger that
   auto-creates a `profiles` row (with the right role) whenever someone signs up.
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (⚠️ keep this secret — backend only, never in frontend code)
4. Go to **Authentication → Providers** and confirm Email is enabled. (Email confirmation
   is on by default — turn it off in **Authentication → Settings** if you want instant signup
   during local testing.)

## 2. Run the backend

```bash
cd backend
cp .env.example .env
# edit .env and paste your Supabase URL + service_role key
npm install
npm run dev        # starts on http://localhost:4000
```

## 3. Run the frontend

```bash
cd frontend
cp .env.example .env
# edit .env: paste Supabase URL + anon key, and VITE_API_URL=http://localhost:4000/api
npm install
npm run dev         # starts on http://localhost:5173
```

Open `http://localhost:5173`. Sign up once as a candidate and once as an employer (two
different emails) to try both flows end-to-end.

---

## What's implemented

**Auth & onboarding**
- Email/password signup with role selection (candidate/employer), Supabase handles verification email.
- A Postgres trigger auto-creates the right `profiles` row on signup.

**Employer flow**
- Company setup + simulated domain verification.
- Job posting wizard: details → screening questions → preferences → preview/publish.
- Shareable job link, view/apply/share event tracking (`job_events` table).
- Applications dashboard: filter by stage/score, sort by AI fit score, bulk shortlist/reject,
  per-candidate evaluate (notes) and in-platform messaging.
- Analytics: views/applications/hires, funnel by stage, source breakdown, rule-based
  AI insights (e.g. "most candidates are missing skill X").
- Nudges for low-application or stale (30+ day) jobs, and one-click job duplication/repost.

**Candidate flow**
- Multi-section profile (education, experience, skills, resume link, preferences) with a
  live profile-completeness percentage.
- Search & filter jobs by title/location/type, save jobs for later.
- Apply with screening-question answers; duplicate applications are blocked.
- "My Applications" with a visual status stepper (Applied → … → Hired/Rejected).
- Placeholder "grow your career" panel (courses, resume builder, mock interviews, etc.)
  — these are UI stubs, not implemented services.

**AI Score & Rank**
Fit scoring (`backend/utils/scoring.js`) is currently **rule-based**, not an LLM call —
it compares job `key_skills`/`experience_required`/`education_required` against the
candidate's profile and returns a 0–100 score plus a breakdown. This is instant and free.

### Upgrading AI scoring to a real LLM
If you want richer, natural-language fit assessment, replace the body of
`scoreCandidate()` in `backend/utils/scoring.js` with a call to the Anthropic API
(pass the job description + candidate profile as JSON, ask for a structured score +
rationale back). Everything else — the dashboard, sorting, filters — already reads
whatever `ai_score` / `ai_score_breakdown` you return, so no other code needs to change.

---

## What's NOT implemented (natural next steps)

- File uploads for resumes/logos (currently just a URL field — wire up Supabase Storage).
- Real email/SMS/push notifications (there's a `notifications` table and in-app bell data,
  but no delivery integration — e.g. Resend/Twilio).
- Payments for "Boost job" / premium upgrades (the `boosted` flag exists on `jobs`, no billing).
- Real-time updates (messages/notifications are poll-on-load, not WebSocket/Supabase Realtime
  subscriptions — easy to add since Supabase supports it natively).
- Admin/moderation tooling, password reset UI (Supabase Auth supports it; just needs a page).
- Automated tests.

---

## Project structure

```
job-portal/
├── supabase/schema.sql          # run this first
├── backend/
│   ├── server.js                # Express entrypoint
│   ├── config/supabaseClient.js # service-role client
│   ├── middleware/auth.js       # verifies Supabase JWT
│   ├── utils/scoring.js         # rule-based AI fit scoring + insights
│   └── routes/                  # profiles, companies, jobs, applications, analytics, misc
└── frontend/
    └── src/
        ├── context/AuthContext.jsx
        ├── lib/{supabaseClient,api}.js
        ├── components/          # Navbar, JobCard, StatusStepper, ProtectedRoute
        └── pages/
            ├── candidate/       # Profile, BrowseJobs, JobDetails, MyApplications, ExploreProducts
            └── employer/        # CompanySetup, Dashboard, PostJob, ApplicationsDashboard, Analytics
```
