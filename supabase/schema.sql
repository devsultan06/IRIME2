-- ══════════════════════════════════════════════════════════════════════════════
-- IRME Platform — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to set up the database.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id             uuid references auth.users(id) on delete cascade primary key,
  email          text not null,
  role           text not null check (role in ('student', 'supervisor')),
  full_name      text not null,
  institution    text,
  supervisor_code text unique,
  created_at     timestamptz default now(),
  last_login     timestamptz
);

-- 2. Students table (links student → supervisor)
create table if not exists public.students (
  user_id        uuid references public.profiles(id) on delete cascade primary key,
  supervisor_id  uuid references public.profiles(id) not null,
  matric_number  text,
  school_name    text
);

-- 3. Submissions table
create table if not exists public.submissions (
  id              uuid default gen_random_uuid() primary key,
  student_id      uuid references public.profiles(id) on delete cascade not null,
  topic           text not null,
  subject_area    text,
  class_arm       text,
  image_url       text not null,
  image_filename  text,
  extracted_text  text,
  status          text check (status in ('Pending', 'Reviewed', 'Flagged')) default 'Pending',
  created_at      timestamptz default now()
);

-- 4. Evaluations table
create table if not exists public.evaluations (
  submission_id      uuid references public.submissions(id) on delete cascade primary key,
  supervisor_id      uuid references public.profiles(id) not null,
  content_score      integer not null check (content_score between 0 and 100),
  organization_score integer not null check (organization_score between 0 and 100),
  feedback           text not null,
  is_flagged         boolean default false,
  flag_reason        text,
  evaluated_at       timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_submissions_student on public.submissions(student_id);
create index if not exists idx_submissions_status on public.submissions(status);
create index if not exists idx_students_supervisor on public.students(supervisor_id);

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.submissions enable row level security;
alter table public.evaluations enable row level security;

-- Profiles: users can read all profiles, update their own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Allow profile insert during signup (handles email-confirmation-disabled or enabled states seamlessly)
create policy "Allow profile creation on signup"
  on public.profiles for insert
  with check (true);

-- Students: supervisors can see their students, students can see themselves
create policy "Students viewable by self or supervisor"
  on public.students for select
  to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = supervisor_id
  );

-- Allow student record insertion during signup
create policy "Allow student record creation on signup"
  on public.students for insert
  with check (true);

-- Submissions: students can manage their own, supervisors can read their students'
create policy "Students can insert own submissions"
  on public.submissions for insert
  to authenticated
  with check (auth.uid() = student_id);

create policy "Submissions viewable by student or their supervisor"
  on public.submissions for select
  to authenticated
  using (
    auth.uid() = student_id
    or exists (
      select 1 from public.students
      where students.user_id = submissions.student_id
        and students.supervisor_id = auth.uid()
    )
  );

create policy "Submissions updatable by student's supervisor"
  on public.submissions for update
  to authenticated
  using (
    exists (
      select 1 from public.students
      where students.user_id = submissions.student_id
        and students.supervisor_id = auth.uid()
    )
  );

-- Evaluations: supervisors can manage evaluations for their students
create policy "Evaluations viewable by student or supervisor"
  on public.evaluations for select
  to authenticated
  using (
    auth.uid() = supervisor_id
    or exists (
      select 1 from public.submissions s
      where s.id = evaluations.submission_id
        and s.student_id = auth.uid()
    )
  );

create policy "Supervisors can insert evaluations"
  on public.evaluations for insert
  to authenticated
  with check (auth.uid() = supervisor_id);

create policy "Supervisors can update own evaluations"
  on public.evaluations for update
  to authenticated
  using (auth.uid() = supervisor_id);

-- ── Storage Bucket ───────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('board-images', 'board-images', true)
on conflict do nothing;

create policy "Authenticated users can upload board images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'board-images');

create policy "Board images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'board-images');
