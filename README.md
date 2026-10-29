# Squad Manager

Squad Manager is a football management dashboard for following a club across a
competition season. It combines a React web application with a Node.js API,
PostgreSQL persistence, a Spring Boot analytics service, and an optional
Python/FastAPI service for LLM-assisted match reports.

The application supports competition and club selection, season contexts,
standings, fixtures and results, squad management, player statistics, transfer
tracking, match events, external football-data synchronization, and dashboard
analytics.

## Features

### Global context

- Select a competition from `football-data.org`.
- Select a season and then a club participating in that competition.
- Keep the selected competition, season, and club available across all pages.
- Create or reuse a season context for the selected competition, year, and club.
- Show loading, error, and empty states in the selectors.

### Dashboard

- Show matches played and upcoming matches.
- Show recent form and points from recent completed matches.
- Show the selected club's position and points in the imported standings.
- Calculate the club's points efficiency.
- Show the next scheduled match.
- Show recent results and their venues.

### Matches

- List upcoming and completed matches for the active season.
- Add or edit a match manually.
- Update scores for completed matches.
- Delete matches.
- Add and remove match events, including goals, cards, and substitutions.
- View the match context and event timeline.
- Synchronize the selected club's fixtures and results from `football-data.org`.
- Display synchronization progress, success information, imported match count,
  timestamps, and retry actions.
- Request an LLM-generated match report through the optional LLM service.

### Squad

- View the players associated with the active season.
- Show player role, nationality, date of birth, and season statistics.
- Add or edit players manually.
- Remove a player from the active season squad.
- Import the squad from `football-data.org`.
- Keep player records deduplicated using the external football-data player ID.

### Standings

- View imported competition standings.
- Display total, home, and away tables when returned by the external provider.
- Import the standings for the active competition and season.
- Store position, matches played, wins, draws, losses, goals, goal difference,
  points, and form.

### Transfer market

- List incoming and outgoing transfers for the active season.
- Add or edit a transfer.
- Delete a transfer.
- Store transfer date, club, fee, player, and transfer type.

### Reliability and presentation

- Centralized frontend API requests and error parsing.
- Human-readable English error messages for network and API failures.
- Backend database health endpoint.
- Automatic SQL migrations before the API starts.
- Responsive glassmorphism UI with reusable cards, selectors, notices, and
  statistic components.
- Docker and Helm deployment definitions.

## Architecture

```text
Browser
  |
  | React 18 + Vite + Tailwind CSS
  | http://localhost:5173 (development) or http://localhost (production)
  |
  +--> Node.js / Express API --------------------+
  |    http://localhost:3000                      |
  |                                                |
  |    +--> PostgreSQL                             |
  |    +--> football-data.org API                  |
  |    +--> Python LLM service (optional)          |
  |                                                |
  +--> Spring Boot analytics API ------------------+
       http://localhost:8080
```

### Main components

| Component | Location | Responsibility | Default port |
|---|---|---|---:|
| Frontend | `src/` | React pages, selectors, global context, UI | 5173 / 80 |
| Node API | `backend/` | REST API, synchronization, migrations | 3000 |
| PostgreSQL | Docker or external instance | Application data | 5432 |
| Analytics API | `backend-spring/` | Season summary calculations | 8080 |
| LLM service | `backend/services/llm_interaction/` | Optional generated reports | 8000 |

## Frontend routes

The frontend uses React Router. The route names are currently Italian because
they are part of the existing application URL contract.

| Route | Page |
|---|---|
| `/` | Dashboard |
| `/partite` | Matches |
| `/rosa` | Squad |
| `/classifica` | Standings |
| `/mercato` | Transfer market |

## Backend API

The Node API is mounted below `/api`.

### Seasons and context

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/seasons` | List available seasons |
| `GET` | `/api/seasons/current` | Get the current season |
| `POST` | `/api/seasons` | Create or update a season |
| `POST` | `/api/seasons/context` | Create or reuse a competition/season/club context |

### Players and squad

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/players` | List players |
| `GET` | `/api/players/squad?seasonId=<uuid>` | List the season squad with statistics |
| `POST` | `/api/players` | Create or update a player and associate it with a season |
| `DELETE` | `/api/players/<id>?seasonId=<uuid>` | Remove a player from a season |

### Matches and events

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/matches?seasonId=<uuid>` | List season matches |
| `GET` | `/api/matches/<id>` | Get a match and its events |
| `GET` | `/api/matches/<id>/context` | Get match context and win/draw/loss result |
| `POST` | `/api/matches` | Create or update a match |
| `PATCH` | `/api/matches/<id>` | Update a match score |
| `DELETE` | `/api/matches/<id>` | Delete a match |
| `POST` | `/api/matches/<id>/events` | Add a match event |
| `DELETE` | `/api/matches/<id>/events/<eventId>` | Delete a match event |
| `POST` | `/api/matches/<id>/llmService` | Request an LLM match report |

### Transfers

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/transfers?seasonId=<uuid>` | List transfers, optionally filtered by season |
| `POST` | `/api/transfers` | Create or update a transfer |
| `DELETE` | `/api/transfers/<id>` | Delete a transfer |

### Football-data synchronization

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/football-data/competitions` | List available competitions |
| `GET` | `/api/football-data/competitions/<code>/teams?season=<year>` | List competition teams |
| `GET` | `/api/football-data/competitions/<code>/matches` | Fetch normalized competition matches |
| `POST` | `/api/football-data/competitions/<code>/import` | Import matches for a selected club |
| `POST` | `/api/football-data/competitions/<code>/standings/import` | Import standings |
| `GET` | `/api/football-data/competitions/<code>/standings` | Read stored standings |
| `POST` | `/api/football-data/teams/<teamId>/squad/import` | Import a team's squad |

### Health

```text
GET /api/health
```

When PostgreSQL is reachable, the endpoint returns HTTP `200`:

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-10-29T11:14:02.384Z"
}
```

When the database check fails, it returns HTTP `503` and a `degraded` status.
The endpoint currently checks PostgreSQL only; it does not assert that
football-data.org, Spring analytics, or the LLM service are available.

## Requirements

For the Docker Compose workflow:

- Docker Desktop with Docker Compose
- A `FOOTBALL_DATA_TOKEN` for the football-data.org API
- An OpenRouter-compatible key and provider configuration if the LLM service is
  enabled

For running services without Docker:

- Node.js 20 or later
- PostgreSQL 15 or compatible
- Java 17 or later and Maven for the Spring service
- Python 3.12 for the LLM service

## Configuration

### Frontend

The frontend reads Vite variables from `src/lib/..env` in the current project
layout:

```env
VITE_API_URL=http://localhost:3000
VITE_ANALYTICS_API_URL=http://localhost:8080
```

`VITE_API_URL` controls the Node API base URL. `VITE_ANALYTICS_API_URL`
controls the Spring analytics base URL. Values prefixed with `VITE_` are
embedded into the browser bundle, so do not put secrets in them.

### Node API

The backend uses:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/squad_manager
PORT=3000
FOOTBALL_DATA_TOKEN=<football-data.org token>
LLM_SERVICE_URL=http://localhost:8000
```

In Docker Compose, the backend uses the service name `postgres` instead of
`localhost` for the database and `llm-service` for the LLM service.

### Spring analytics

The Spring service supports:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/squad_manager
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<database password>
```

Its summary endpoint is:

```text
GET /api/analytics/seasons/<seasonId>/summary
```

### LLM service

The LLM service reads its provider configuration from the environment file
used by Docker Compose. Keep API keys outside source control. It exposes:

```text
POST /api/service
```

The Node API forwards match report requests to this service. If the service is
not configured or running, standard match management remains available but
LLM-generated reports do not.

## Run with Docker Compose

1. Create a root `.env` file containing the external service configuration.
   At minimum:

   ```env
   FOOTBALL_DATA_TOKEN=<football-data.org token>
   OPENROUTER_API_KEY=<provider key>
   LLM_PROVIDER=openai/gpt-4o-mini
   ```

2. Start the development stack:

   ```powershell
   docker compose up -d --build
   ```

3. Open the application:

   - Development frontend: <http://localhost:5173>
   - Production frontend: <http://localhost>
   - Node API: <http://localhost:3000>
   - Backend health: <http://localhost:3000/api/health>
   - Spring analytics: <http://localhost:8080>
   - LLM service: <http://localhost:8000>

4. Inspect service logs when troubleshooting:

   ```powershell
   docker compose logs -f backend
   docker compose logs -f frontend-dev
   docker compose logs -f postgres
   ```

The `frontend-dev` service is convenient during development. The `frontend`
service builds the Vite bundle and serves it with Nginx.

To stop the services without removing the database volume:

```powershell
docker compose down
```

To remove the persistent database volume as well, use this only when the local
database can be recreated:

```powershell
docker compose down -v
```

## Run locally without Docker

### Frontend

```powershell
npm install
npm run dev
```

The Vite development server is available at <http://localhost:5173>.

Useful frontend commands:

```powershell
npm run build
npm run preview
```

### Node API

Install backend dependencies and start PostgreSQL first:

```powershell
cd backend
npm install
node index.js
```

The backend runs migrations before listening on port `3000`.

### Spring analytics

```powershell
cd backend-spring
.\mvnw.cmd spring-boot:run
```

The analytics API listens on port `8080`.

### LLM service

```powershell
cd backend/services/llm_interaction
python -m pip install -r requirements.txt
python -m uvicorn service:app --host 0.0.0.0 --port 8000
```

## Database and migrations

The initial schema is described in [`backend/db.sql`](./backend/db.sql).
Incremental changes are stored in [`backend/migrations`](./backend/migrations).

On every backend startup, [`backend/migrate.js`](./backend/migrate.js):

1. Acquires a PostgreSQL advisory lock.
2. Creates `schema_migrations` if necessary.
3. Reads SQL files from `backend/migrations/` in filename order.
4. Skips versions already recorded in `schema_migrations`.
5. Runs each pending migration in its own transaction.
6. Records the migration only after a successful commit.
7. Prevents the API from starting if a migration fails.

The advisory-lock number is an internal coordination key; it is not a
credential or an application identifier.

Important migration rules:

- Never edit a migration that has already been applied.
- Add a new, numerically ordered SQL file for future schema changes.
- The PostgreSQL Docker initialization script runs only when the database
  volume is created for the first time.
- Existing volumes receive later changes through the automatic migration
  runner.

The current schema includes seasons, competition/club contexts, players,
season squads, player statistics, matches, match events, market transfers, and
imported standings.

## Kubernetes and Helm

Deployment templates are available in:

- [`helm/squadmanager`](./helm/squadmanager) for the Helm chart.
- [`k8s`](./k8s) for individual Kubernetes manifests.

The chart defines deployments/services for the frontend, Node backend, LLM
service, and PostgreSQL, as well as an ingress, namespace, secrets, and a
horizontal pod autoscaler.

Example Helm commands:

```powershell
helm lint helm/squadmanager
helm upgrade --install squadmanager helm/squadmanager -n default
```

The repository's current chart values use local image tags and `pullPolicy:
Never`; build or load the images into the target cluster before deploying.
Replace example secret values with a Kubernetes Secret or an external secret
manager in any shared or production environment.

The ingress keeps `/api` requests routed to the backend and `/` requests
routed to the frontend. Verify the actual namespace and release configuration
before upgrading an existing installation.

## Project structure

```text
.
├── backend/
│   ├── migrations/       Incremental PostgreSQL migrations
│   ├── routes/           Express REST routes
│   ├── services/         football-data.org integration
│   ├── db.js             PostgreSQL pool
│   ├── index.js          API bootstrap and health endpoint
│   └── migrate.js        Startup migration runner
├── backend-spring/
│   └── src/              Spring Boot analytics service
├── backend/services/
│   └── llm_interaction/  FastAPI LLM service
├── helm/squadmanager/    Helm deployment chart
├── k8s/                  Kubernetes manifests
├── src/
│   ├── api/              Frontend API clients
│   ├── components/       Shared UI and selectors
│   ├── context/          Season and club state
│   └── pages/            Dashboard application pages
├── docker-compose.yml
├── Dockerfile             Frontend development/production image
└── nginx.conf              SPA fallback configuration
```

## Validation and troubleshooting

Build the frontend after frontend changes:

```powershell
npm run build
```

Check backend syntax:

```powershell
node --check backend/index.js
node --check backend/migrate.js
```

Validate the Compose file:

```powershell
docker compose config --quiet
```

Common issues:

- **The homepage is not shown at `localhost:3000`:** port `3000` is the Node
  API. Use `http://localhost:5173` for the development frontend or
  `http://localhost` for the production frontend.
- **The league selector is empty:** check `GET /api/football-data/competitions`,
  `FOOTBALL_DATA_TOKEN`, backend logs, and the football-data.org plan limits.
- **A migration column is missing:** rebuild or restart the backend so the
  migration runner can apply pending files; do not rely on `db.sql` for an
  already-created PostgreSQL volume.
- **Match synchronization reports an `ON CONFLICT` error:** verify that the
  `matches_season_external_id_unique` index from migration `005` exists.
- **The analytics cards are unavailable:** confirm that Spring is running on
  port `8080` and that `VITE_ANALYTICS_API_URL` points to it.
- **LLM reports fail:** confirm the LLM service, provider, and API key
  configuration. This does not prevent standard match operations.

## Data providers and limitations

Competition, team, match, standings, and squad imports depend on the
availability and plan limits of `football-data.org`. The provider token must
be valid and permitted to access the requested competition and season.

The application stores imported data in PostgreSQL. Re-import operations update
records using the season and external provider identifiers where supported;
manual records remain available through the normal CRUD endpoints.

## Security notes

- Do not commit `.env` files, API keys, provider tokens, or real production
  passwords.
- Replace the example Docker and Helm credentials before any shared or
  production deployment.
- Restrict database and service ports in production networking.
- Store Kubernetes secrets in a secrets manager where possible.
- Treat frontend `VITE_*` variables as public configuration.
