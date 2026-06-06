-- SAFE UPDATE SCRIPT
-- Run this to enable the Email Search feature.
-- It works safely even if you already have the tables set up.

-- 1. Add email column to profiles (safe to run if already exists)
alter table profiles add column if not exists email text;

-- 2. Update the handle_new_user function to include email (safe to replace)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- 3. Backfill emails for existing users
update profiles
set email = auth.users.email
from auth.users
where profiles.id = auth.users.id
and profiles.email is null;
