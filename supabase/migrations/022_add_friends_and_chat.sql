-- 022_add_friends_and_chat.sql
-- Add tables for friends system, global chat, direct messages, and activity feed

-- Friendships table (undirected, status enum)
create table public.friendships (
  id uuid default uuid_generate_v4() primary key,
  user_id_1 uuid references auth.users(id) not null,
  user_id_2 uuid references auth.users(id) not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Ensure a unique pair (user1, user2) regardless of order
create unique index friendships_unique_pair on public.friendships (
  (least(user_id_1, user_id_2)),
  (greatest(user_id_1, user_id_2))
);

-- Global chat messages table
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Direct messages table (one-to-one conversation)
create table public.direct_messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id) not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Activity feed table (store events)
create table public.activity_feed (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  type text not null, -- e.g., 'workout_completed', 'pr_achieved'
  payload jsonb not null,
  created_at timestamp with time zone default now()
);

-- Row level security policies (public read for accepted friendships, private for messages)
alter table public.friendships enable row level security;
create policy "friends_select" on public.friendships for select using (
  (user_id_1 = auth.uid()) or (user_id_2 = auth.uid())
);
create policy "friends_insert" on public.friendships for insert with check (
  (user_id_1 = auth.uid()) or (user_id_2 = auth.uid())
);
create policy "friends_update" on public.friendships for update using (
  (user_id_1 = auth.uid()) or (user_id_2 = auth.uid())
);

alter table public.chat_messages enable row level security;
create policy "chat_public_read" on public.chat_messages for select using (true);
create policy "chat_insert" on public.chat_messages for insert with check (auth.uid() = user_id);

alter table public.direct_messages enable row level security;
create policy "dm_select" on public.direct_messages for select using (
  (sender_id = auth.uid()) or (receiver_id = auth.uid())
);
create policy "dm_insert" on public.direct_messages for insert with check (auth.uid() = sender_id);

alter table public.activity_feed enable row level security;
create policy "feed_select" on public.activity_feed for select using (true);
create policy "feed_insert" on public.activity_feed for insert with check (auth.uid() = user_id);

-- Grant appropriate privileges
grant select, insert, update on public.friendships to anon, authenticated;
grant select, insert on public.chat_messages to anon, authenticated;
grant select, insert on public.direct_messages to anon, authenticated;
grant select, insert on public.activity_feed to anon, authenticated;
