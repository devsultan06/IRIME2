-- ══════════════════════════════════════════════════════════════════════════════
-- Direct Feedback Threads — Supabase SQL Updates
-- Run this in your Supabase SQL Editor to enable comment threads.
-- ══════════════════════════════════════════════════════════════════════════════

-- Create comments table
create table if not exists public.comments (
  id            uuid default gen_random_uuid() primary key,
  submission_id uuid references public.submissions(id) on delete cascade not null,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  content       text not null,
  created_at    timestamptz default now()
);

-- Enable RLS
alter table public.comments enable row level security;

-- Index
create index if not exists idx_comments_submission on public.comments(submission_id);

-- Read policy: users can read comments on submissions they have access to
create policy "Comments viewable by submission participants"
  on public.comments for select
  to authenticated
  using (
    exists (
      select 1 from public.submissions s
      where s.id = comments.submission_id
        and (
          s.student_id = auth.uid()
          or exists (
            select 1 from public.students st
            where st.user_id = s.student_id
              and st.supervisor_id = auth.uid()
          )
        )
    )
  );

-- Insert policy: users can post comments on submissions they have access to
create policy "Users can post comments on accessible submissions"
  on public.comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.submissions s
      where s.id = submission_id
        and (
          s.student_id = auth.uid()
          or exists (
            select 1 from public.students st
            where st.user_id = s.student_id
              and st.supervisor_id = auth.uid()
          )
        )
    )
  );
