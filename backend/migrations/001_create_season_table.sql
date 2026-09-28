create table if not exists season_table (
  season_id uuid not null references seasons(id) on delete cascade,
  competition_code text not null,
  type text not null check (type in ('TOTAL','HOME','AWAY')),
  team_external_id integer not null,
  team_name text not null,
  position int not null,
  match_played int not null,
  win int,
  draw int,
  lose int,
  goal_scored int,
  goal_conceded int,
  goal_difference int,
  points int,
  UNIQUE (season_id, competition_code, type, team_external_id)
);

alter table season_table add column if not exists team_name text;