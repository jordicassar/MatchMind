-- Season column (all existing matches are 2024/25), plus the team links.

ALTER TABLE "Match" ADD COLUMN "season" INTEGER NOT NULL DEFAULT 2024;
ALTER TABLE "Match" ALTER COLUMN "season" DROP DEFAULT;

-- Link the 15 clubs in both seasons (API-Sports id -> football-data id)
UPDATE "Team" AS t
SET "fdId" = m.fd_id
FROM (VALUES
  (542, 263),  -- Alaves
  (531, 77),   -- Athletic Club
  (530, 78),   -- Atletico Madrid
  (529, 81),   -- Barcelona
  (538, 558),  -- Celta Vigo
  (540, 80),   -- Espanyol
  (546, 82),   -- Getafe
  (727, 79),   -- Osasuna
  (728, 87),   -- Rayo Vallecano
  (543, 90),   -- Real Betis
  (541, 86),   -- Real Madrid
  (548, 92),   -- Real Sociedad
  (536, 559),  -- Sevilla
  (532, 95),   -- Valencia
  (533, 94)    -- Villarreal
) AS m(api_id, fd_id)
WHERE t."externalId" = m.api_id;

-- Add the 5 promoted clubs (crest URLs follow the API-Sports pattern)
INSERT INTO "Team" ("name", "externalId", "fdId", "crest") VALUES
  ('Elche',               797,  285,  'https://media.api-sports.io/football/teams/797.png'),
  ('Levante',             539,  88,   'https://media.api-sports.io/football/teams/539.png'),
  ('Malaga',              535,  84,   'https://media.api-sports.io/football/teams/535.png'),
  ('Deportivo La Coruna', 544,  560,  'https://media.api-sports.io/football/teams/544.png'),
  ('Racing Santander',    4665, 5335, 'https://media.api-sports.io/football/teams/4665.png')
ON CONFLICT ("name") DO NOTHING;
