-- PharmDC Supabase Schema
-- Run this in the Supabase SQL editor at:
-- https://supabase.com/dashboard/project/gakjmoiwsqfxdmmpfmga/sql/new

-- ============================================================
-- ENTRIES TABLE
-- ============================================================

create table entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  section text not null check (section in ('drugs', 'conditions', 'anatomy', 'skills', 'regulation')),
  template text not null check (template in ('drug', 'condition', 'anatomy', 'skill', 'regulation')),
  content jsonb not null,
  tags text[] default '{}',
  is_favourite boolean default false
);

-- Row level security
alter table entries enable row level security;

create policy "Users can manage their own entries"
  on entries for all
  using (auth.uid() = user_id);

-- Indexes
create index entries_user_section on entries(user_id, section);
create index entries_title_search on entries using gin(to_tsvector('english', title));

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on entries
  for each row execute function update_updated_at();

-- ============================================================
-- RECENT VIEWS TABLE
-- ============================================================

create table recent_views (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  entry_id uuid references entries(id) on delete cascade,
  viewed_at timestamp with time zone default now(),
  unique(user_id, entry_id)
);

alter table recent_views enable row level security;

create policy "Users can manage their own recent views"
  on recent_views for all
  using (auth.uid() = user_id);

create index recent_views_user_viewed on recent_views(user_id, viewed_at desc);
