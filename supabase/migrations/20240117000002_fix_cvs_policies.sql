-- Add RLS policies for cvs table
-- These policies were missing and causing PostgREST errors

-- Users can view their own CVs
create policy "Users can view own CV." on public.cvs for select using (auth.uid() = user_id);

-- Users can insert their own CVs
create policy "Users can insert own CV." on public.cvs for insert with check (auth.uid() = user_id);

-- Users can update their own CVs
create policy "Users can update own CV." on public.cvs for update using (auth.uid() = user_id);

-- Users can delete their own CVs
create policy "Users can delete own CV." on public.cvs for delete using (auth.uid() = user_id);