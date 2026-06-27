-- SUPABASE POSTGRESQL SCHEMA FOR SOCIALSELL AI

-- 1. Create Profiles Table (links to Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  company_name text,
  niche text,
  about text,
  promote_type text default 'products',
  promote_details text,
  audience_type text default 'generic',
  audience_details text,
  region text,
  social_links jsonb default '{}'::jsonb,
  branding_guidelines text,
  past_posts jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Products Table (related to profiles)
create table public.products (
  id bigserial primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  price text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable Row-Level Security (RLS) on both tables
alter table public.profiles enable row level security;
alter table public.products enable row level security;

-- 4. Create RLS Policies for Profiles
create policy "Users can view their own profile."
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

-- 5. Create RLS Policies for Products
create policy "Users can view their own products."
  on public.products for select
  using ( auth.uid() = profile_id );

create policy "Users can insert their own products."
  on public.products for insert
  with check ( auth.uid() = profile_id );

create policy "Users can update their own products."
  on public.products for update
  using ( auth.uid() = profile_id );

create policy "Users can delete their own products."
  on public.products for delete
  using ( auth.uid() = profile_id );

-- 6. Set up a trigger to automatically create a public profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, company_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- Remove the trigger if it already exists to avoid collisions
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Create Assets Table
create table public.assets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  filename text not null,
  file_url text not null,
  file_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 8. Create Posts Table (Drafts Queue)
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  asset_id uuid references public.assets(id) on delete cascade,
  platform text not null,
  caption text not null,
  hashtags text,
  cta text,
  media_url text,
  status text not null default 'draft',
  classification_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 9. Enable RLS
alter table public.assets enable row level security;
alter table public.posts enable row level security;

-- 10. RLS Policies for Assets
create policy "Users can manage their own assets."
  on public.assets for all
  using ( auth.uid() = user_id );

-- 11. RLS Policies for Posts
create policy "Users can manage their own posts."
  on public.posts for all
  using ( auth.uid() = user_id );

-- 12. Create Intake Items Table
create table public.intake_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null, -- 'media' or 'text'
  sub_type text not null, -- 'deal', 'achievement', 'offer', 'announcement', 'media'
  content text,
  media_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 13. Enable RLS on Intake Items
alter table public.intake_items enable row level security;

-- 14. RLS Policies for Intake Items
create policy "Users can manage their own intake items."
  on public.intake_items for all
  using ( auth.uid() = user_id );

-- 15. Create Integrations Table
create table public.integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  platform text not null, -- 'instagram' | 'linkedin' | 'twitter'
  account_name text not null,
  access_token text not null,
  platform_account_id text not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, platform)
);

-- 16. Enable RLS on Integrations
alter table public.integrations enable row level security;

-- 17. RLS Policies for Integrations
create policy "Users can manage their own integrations."
  on public.integrations for all
  using ( auth.uid() = user_id );



