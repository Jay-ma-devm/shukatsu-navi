-- supabase/migrations/002_add_tags.sql
alter table articles
  add column if not exists tags       text[] default '{}',
  add column if not exists sub_category text,
  add column if not exists reading_time int;   -- 読了時間（分）

create index if not exists articles_tags_idx on articles using gin(tags);
create index if not exists articles_category_sub_idx on articles(category, sub_category);
