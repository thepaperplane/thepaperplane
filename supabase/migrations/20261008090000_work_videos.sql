-- =============================================================================
-- Launch and testimonial videos shown beside each project's website preview.
--
-- Additive: a public bucket for the video files (the browser uploads straight
-- to it through a signed URL, because a video is bigger than a server action
-- may carry) and a table recording what each file is. RLS on, no policies —
-- only the server's service key reads or writes the table.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'work-videos',
  'work-videos',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do nothing;

create table if not exists public.project_videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null default 'launch' check (kind in ('launch', 'testimonial', 'walkthrough')),
  title text,
  -- Path inside the work-videos bucket.
  path text not null,
  width integer,
  height integer,
  position integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.project_videos enable row level security;
create index if not exists project_videos_project_idx on public.project_videos (project_id, position);

-- How the video is shown on the site: a wide player, or a tall one for phone-shaped footage.
alter table public.project_videos
  add column if not exists orientation text not null default 'landscape'
  check (orientation in ('landscape', 'portrait'));
update public.project_videos set orientation = 'portrait' where height is not null and width is not null and height > width;
