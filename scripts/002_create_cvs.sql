-- Create CVs table for AI-generated CVs
create table if not exists public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  full_name text not null,
  email text not null,
  phone text,
  location text,
  photo_url text,
  summary text,
  experience jsonb default '[]'::jsonb, -- Array of experience objects
  education jsonb default '[]'::jsonb,  -- Array of education objects
  skills text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cvs enable row level security;

-- RLS Policies for CVs
create policy "cvs_select_own"
  on public.cvs for select
  using (auth.uid() = user_id);

create policy "cvs_insert_own"
  on public.cvs for insert
  with check (auth.uid() = user_id);

create policy "cvs_update_own"
  on public.cvs for update
  using (auth.uid() = user_id);

create policy "cvs_delete_own"
  on public.cvs for delete
  using (auth.uid() = user_id);
