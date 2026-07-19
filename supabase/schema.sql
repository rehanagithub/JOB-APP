-- ============================================================
-- JOB PORTAL — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. PROFILES (extends Supabase auth.users)
-- role: 'candidate' | 'employer'
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('candidate', 'employer')),
  full_name text,
  phone text,
  avatar_url text,
  location text,
  -- candidate-only fields
  education jsonb default '[]'::jsonb,      -- [{school, degree, year}]
  experience jsonb default '[]'::jsonb,     -- [{company, title, years, description}]
  skills text[] default '{}',
  resume_url text,
  preferences jsonb default '{}'::jsonb,    -- {role, location, salary, internship_type}
  profile_complete_pct int default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. COMPANIES
-- ------------------------------------------------------------
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  industry text,
  size text,
  website text,
  logo_url text,
  description text,
  domain_verified boolean default false,
  verification_doc_url text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 3. JOBS
-- status: 'draft' | 'live' | 'closed'
-- ------------------------------------------------------------
create table public.jobs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null,
  job_type text not null check (job_type in ('job', 'internship')),
  description text,
  location text,
  remote boolean default false,
  salary_min numeric,
  salary_max numeric,
  experience_required text,
  notice_period text,
  key_skills text[] default '{}',
  education_required text,
  languages text[] default '{}',
  screening_questions jsonb default '[]'::jsonb, -- [{question, type}]
  status text not null default 'draft' check (status in ('draft','live','closed')),
  boosted boolean default false,
  share_slug text unique,
  views int default 0,
  created_at timestamptz default now(),
  published_at timestamptz
);

-- ------------------------------------------------------------
-- 4. APPLICATIONS
-- stage: applied -> under_review -> shortlisted -> interview -> offered / rejected
-- ------------------------------------------------------------
create table public.applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb default '{}'::jsonb,
  source text default 'direct', -- direct, linkedin, whatsapp, referral, other
  ai_score int,                 -- 0-100
  ai_score_breakdown jsonb,     -- {skills_match, experience_match, education_match, notes}
  stage text not null default 'applied'
    check (stage in ('applied','under_review','shortlisted','interview','offered','rejected','hired')),
  recruiter_notes text,
  recruiter_rating int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (job_id, candidate_id)
);

-- ------------------------------------------------------------
-- 5. MESSAGES (in-platform communication)
-- ------------------------------------------------------------
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 6. NOTIFICATIONS
-- ------------------------------------------------------------
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, -- application_update, job_expiring, low_applications, nudge, message
  title text not null,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 7. SAVED JOBS (candidate "save for later")
-- ------------------------------------------------------------
create table public.saved_jobs (
  candidate_id uuid references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (candidate_id, job_id)
);

-- ------------------------------------------------------------
-- 8. JOB EVENTS (analytics: view/apply/source tracking)
-- ------------------------------------------------------------
create table public.job_events (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.jobs(id) on delete cascade,
  event_type text not null check (event_type in ('view','apply','share')),
  source text default 'direct',
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_jobs_company on public.jobs(company_id);
create index idx_jobs_status on public.jobs(status);
create index idx_applications_job on public.applications(job_id);
create index idx_applications_candidate on public.applications(candidate_id);
create index idx_job_events_job on public.job_events(job_id);
create index idx_notifications_user on public.notifications(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_events enable row level security;

-- Profiles: users can read/update their own profile; anyone can read basic public profile info
create policy "profiles_select_own" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Companies: owner manages; jobs' company info is publicly readable
create policy "companies_select_all" on public.companies for select using (true);
create policy "companies_insert_owner" on public.companies for insert with check (auth.uid() = owner_id);
create policy "companies_update_owner" on public.companies for update using (auth.uid() = owner_id);

-- Jobs: live jobs are public; owners manage their own jobs (any status)
create policy "jobs_select_live_or_owner" on public.jobs for select
  using (status = 'live' or created_by = auth.uid());
create policy "jobs_insert_owner" on public.jobs for insert with check (created_by = auth.uid());
create policy "jobs_update_owner" on public.jobs for update using (created_by = auth.uid());
create policy "jobs_delete_owner" on public.jobs for delete using (created_by = auth.uid());

-- Applications: candidate sees their own; employer sees applications to their jobs
create policy "applications_select_candidate" on public.applications for select
  using (candidate_id = auth.uid());
create policy "applications_select_employer" on public.applications for select
  using (exists (select 1 from public.jobs j where j.id = job_id and j.created_by = auth.uid()));
create policy "applications_insert_candidate" on public.applications for insert
  with check (candidate_id = auth.uid());
create policy "applications_update_candidate" on public.applications for update
  using (candidate_id = auth.uid());
create policy "applications_update_employer" on public.applications for update
  using (exists (select 1 from public.jobs j where j.id = job_id and j.created_by = auth.uid()));

-- Messages: either party on the application thread
create policy "messages_select_parties" on public.messages for select
  using (
    exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = application_id and (a.candidate_id = auth.uid() or j.created_by = auth.uid())
    )
  );
create policy "messages_insert_parties" on public.messages for insert
  with check (
    sender_id = auth.uid() and exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = application_id and (a.candidate_id = auth.uid() or j.created_by = auth.uid())
    )
  );

-- Notifications: only the recipient
create policy "notifications_select_own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update using (user_id = auth.uid());

-- Saved jobs: candidate only
create policy "saved_jobs_all_own" on public.saved_jobs for all using (candidate_id = auth.uid());

-- Job events: insert open (anonymous view tracking), select restricted to job owner
create policy "job_events_insert_all" on public.job_events for insert with check (true);
create policy "job_events_select_owner" on public.job_events for select
  using (exists (select 1 from public.jobs j where j.id = job_id and j.created_by = auth.uid()));

-- ============================================================
-- TRIGGER: auto-create profile row on signup (role passed via user metadata)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'candidate'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at maintenance
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger trg_applications_updated before update on public.applications
  for each row execute procedure public.set_updated_at();
