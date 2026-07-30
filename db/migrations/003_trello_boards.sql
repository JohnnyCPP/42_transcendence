create table if not exists boards (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  created_by_user_id text not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists boards_organization_id_idx
  on boards(organization_id);
