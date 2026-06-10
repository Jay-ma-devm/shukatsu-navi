-- supabase/migrations/003_likes_comments.sql
-- いいね・コメント機能のためのスキーマ追加

-- 1. articles に likes カウンタ追加
alter table articles add column if not exists likes int default 0;

-- 2. likes トラッキングテーブル（重複防止用、IPまたはfingerprintで識別）
create table if not exists article_likes (
  id           uuid primary key default gen_random_uuid(),
  article_slug text not null,
  visitor_id   text not null,  -- cookie/fingerprintベースのID
  created_at   timestamptz default now(),
  unique(article_slug, visitor_id)
);

create index if not exists article_likes_slug_idx on article_likes(article_slug);

-- 3. comments テーブル
create table if not exists comments (
  id            uuid primary key default gen_random_uuid(),
  article_slug  text not null,
  nickname      text not null,
  content       text not null,
  is_approved   boolean default true,  -- 自動承認（後でモデレーションする場合はfalseに）
  created_at    timestamptz default now()
);

create index if not exists comments_slug_idx on comments(article_slug);
create index if not exists comments_approved_idx on comments(is_approved, created_at desc);

-- RLS有効化（必要に応じて）
alter table article_likes enable row level security;
alter table comments enable row level security;

-- 公開読み取り
create policy "Anyone can read approved comments" on comments
  for select using (is_approved = true);

-- 匿名insert許可（service_roleからは常に許可）
create policy "Anyone can insert comments" on comments
  for insert with check (true);

create policy "Anyone can insert likes" on article_likes
  for insert with check (true);

create policy "Anyone can read likes" on article_likes
  for select using (true);
