-- supabase/migrations/001_initial.sql
create table articles (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  content     text not null,
  meta_desc   text not null,
  keyword     text not null,
  category    text not null,
  published   boolean default true,
  created_at  timestamptz default now()
);

create table keywords (
  id        uuid primary key default gen_random_uuid(),
  keyword   text unique not null,
  category  text not null,
  used      boolean default false
);

create index on articles(created_at desc);
create index on keywords(used) where used = false;
