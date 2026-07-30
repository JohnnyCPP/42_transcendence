create table if not exists board_lists (
  id text primary key,
  board_id text not null references boards(id) on delete cascade,
  name text not null,
  -- Positions are intentionally numeric with gaps (1000, 2000, 3000).
  -- That keeps reorder logic simple now and leaves room for future inserts between lists.
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (board_id, position)
);

create index if not exists board_lists_board_id_idx
  on board_lists(board_id);
