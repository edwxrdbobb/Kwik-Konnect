-- Profiles Table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  role text check (role in ('talent', 'employer')),
  avatar_url text,
  professional_title text,
  location text,
  bio text,
  skills text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Companies Table
create table public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  location text,
  industry text[],
  logo_url text,
  bg_image_url text,
  website text,
  rating numeric default 0,
  verified boolean default false,
  owner_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Jobs Table
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  company_id uuid references public.companies(id),
  location text,
  type text, -- Full-time, Part-time, Contract, etc.
  salary_range text,
  description text,
  requirements text[],
  status text default 'active', -- active, closed
  views integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Applications Table
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs(id),
  applicant_id uuid references public.profiles(id),
  status text default 'applied', -- applied, interviewing, rejected, hired
  cover_letter text,
  cv_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(job_id, applicant_id)
);

-- Saved Jobs Table
create table public.saved_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  job_id uuid references public.jobs(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, job_id)
);

-- CVs Table
create table public.cvs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  full_name text,
  email text,
  phone text,
  location text,
  professional_title text,
  summary text,
  skills text[],
  experience jsonb[], -- Array of objects {title, company, period, description}
  education jsonb[], -- Array of objects {degree, school, year}
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.cvs enable row level security;

-- Basic Policies (Open for demo purposes, refine in production)
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

create policy "Jobs are viewable by everyone." on public.jobs for select using (true);
create policy "Companies are viewable by everyone." on public.companies for select using (true);

