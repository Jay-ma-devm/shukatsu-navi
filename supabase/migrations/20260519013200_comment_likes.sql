-- comment_likes テーブル: コメントへのいいね
create table if not exists comment_likes (
  id          uuid primary key default gen_random_uuid(),
  comment_id  uuid not null references comments(id) on delete cascade,
  visitor_id  text not null,
  created_at  timestamptz default now(),
  unique(comment_id, visitor_id)
);

create index if not exists comment_likes_comment_idx on comment_likes(comment_id);

alter table comment_likes enable row level security;
create policy "Anyone can read comment_likes" on comment_likes for select using (true);
create policy "Anyone can insert comment_likes" on comment_likes for insert with check (true);
