# SQUAD MANAGER APPLICATION

## Overview
**Squad Manager** is a web application that allows the handling of the foremost football leagues: from standings, in turn the squad and players and finally the transfer market.
The Application has features for interacting with the system: Selection buttons for insert seasons, teams, league and in turn import the standings, recent and future matches and also market transfers.

## Database migrations

The backend runs all pending SQL migrations automatically before starting the HTTP server.
Migration files are applied in filename order from `backend/migrations/` and recorded in
the `schema_migrations` table, so each migration runs only once.

To apply pending migrations locally with Docker Compose:

```powershell
docker compose up -d --build backend
```

If a migration fails, the backend does not start and the error is printed in the backend logs.

