-- 20260220175033_add_feed_likes.sql
-- Add tables for activity feed likes and comments

-- Activity Feed Likes table
create table public.activity_feed_likes (
  id uuid default uuid_generate_v4() primary key,
  feed_id uuid references public.activity_feed(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

-- Ensure a user can only like a post once
create unique index activity_feed_likes_unique on public.activity_feed_likes (feed_id, user_id);

-- Activity Feed Comments table
create table public.activity_feed_comments (
  id uuid default uuid_generate_v4() primary key,
  feed_id uuid references public.activity_feed(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Row level security policies
alter table public.activity_feed_likes enable row level security;
create policy "likes_select" on public.activity_feed_likes for select using (true);
create policy "likes_insert" on public.activity_feed_likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on public.activity_feed_likes for delete using (auth.uid() = user_id);

alter table public.activity_feed_comments enable row level security;
create policy "comments_select" on public.activity_feed_comments for select using (true);
create policy "comments_insert" on public.activity_feed_comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on public.activity_feed_comments for delete using (auth.uid() = user_id);

-- Grant appropriate privileges
grant select, insert, delete on public.activity_feed_likes to anon, authenticated;
grant select, insert, delete on public.activity_feed_comments to anon, authenticated;
