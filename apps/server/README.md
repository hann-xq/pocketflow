# PocketFlow Server

NestJS REST API with PostgreSQL for managing users, transactions, categories, and tags. Includes integration with the
ABN AMRO sandbox API to import transactions.

## Features

- Manage users, bank accounts, transactions, categories, and tags
- Import transactions from ABN AMRO via OAuth2 + PSD2 API
- URI-versioned REST API (`/api/v1/`)

## Tech Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL (production), SQLite in-memory (tests)
- **ORM:** TypeORM
- **Testing:** Jest + Supertest (E2E)

## Prerequisites

- Node.js 18 (or higher)
- npm 9 (or higher)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable                | Description                                                                                                          |
|-------------------------|----------------------------------------------------------------------------------------------------------------------|
| `PORT`                  | HTTP port                                                                                                            |
| `JWT_SECRET`            | Secret used to sign JWT tokens                                                                                       |
| `ENCRYPTION_KEY`        | 64-character hex string (32 bytes) used to encrypt sensitive columns at rest.                                        |
| `DB_HOST`               | PostgreSQL host                                                                                                      |
| `DB_PORT`               | PostgreSQL port                                                                                                      |
| `DB_USERNAME`           | PostgreSQL user                                                                                                      |
| `DB_PASSWORD`           | PostgreSQL password                                                                                                  |
| `DB_DATABASE`           | Database name                                                                                                        |
| `ABN_AMRO_API_URL`      | ABN AMRO API base URL                                                                                                |
| `ABN_AMRO_AUTH_URL`     | Authorization endpoint — browser is redirected here to grant consent                                                 |
| `ABN_AMRO_TOKEN_URL`    | Token endpoint — used to exchange the authorization code for an access token                                         |
| `ABN_AMRO_CLIENT_ID`    | Your ABN AMRO client ID. Use `TPP_test` for sandbox testing                                                          |
| `ABN_AMRO_API_KEY`      | API key sent on every request (`API-Key` header) — [see ABN AMRO setup](#1-register-on-the-developer-portal)         |
| `ABN_AMRO_CERT_PATH`    | Path to your mTLS certificate (PEM). Optional in sandbox, required in production                                     |
| `ABN_AMRO_KEY_PATH`     | Path to your mTLS private key (PEM). Optional in sandbox, required in production                                     |
| `ABN_AMRO_REDIRECT_URI` | OAuth2 redirect URI. The sandbox hardcodes `https://localhost/auth` and it cannot be changed in the developer portal |
| `ABN_AMRO_SCOPE`        | OAuth2 scopes to request                                                                                             |

## Administration

A user is considered an administrator when their `isAdmin` flag is `true`. This flag is included in the JWT payload
and is checked by the `AdminGuard`.

The `isAdmin` field is intentionally absent from `POST /users` and `PATCH /users/{id}` — it cannot be set or changed
through the API. The only way to grant administrator access is directly in the database or via the seeder.

### Decorators

| Decorator      | Guard(s) applied             | HTTP response on failure        |
|----------------|------------------------------|---------------------------------|
| `@Auth()`      | `JwtAuthGuard`               | 401                             |
| `@AdminOnly()` | `JwtAuthGuard`, `AdminGuard` | 401 (no token), 403 (non-admin) |

## Test User Credentials

Two users are seeded by default.

| Field    | Regular user       | Administrator       |
|----------|--------------------|---------------------|
| Email    | `test@example.com` | `admin@example.com` |
| Password | `password123`      | `password123`       |
| Admin    | `false`            | `true`              |

## Seeding

### How it works

Each service that owns seed data implements the `ISeeder` interface from `src/seeds/seeder.ts`, which requires two
methods: `seedPriority(): number` and `seed(): Promise<void>`. The `seed()` method checks whether records already exist
before inserting, making every run idempotent.

`SeederModule` uses NestJS's `DiscoveryService` to find all providers that implement `ISeeder` at startup, sorts them by
priority, and calls `seed()` on each in order. This means adding seed data to a new service only requires implementing
the interface; no registration step is needed.

### Seed constants

All seed values are defined in [`src/seeds/seed-data.ts`](src/seeds/seed-data.ts) as exported constants. Both the seeder
services and the E2E tests import from this file, so changing a seed value propagates automatically without having to
update multiple places.

### E2E tests

E2E tests use the same seeding mechanism. Each test resets the in-memory SQLite database with
`dataSource.synchronize(true)` and then calls `SeederService.run()` to restore the base data. Tests resolve entity IDs
from the seeded records via service calls in `beforeEach`, so they never depend on hardcoded UUIDs.

## Running the application

```bash
# Development (watch mode)
npm run start:dev

# Development (single run)
npm run start

# Production
npm run build
npm run start:prod
```

The API is available at `http://localhost:3000/api/v1`. When running via Docker, the API is available at
`https://localhost/api/v1`.

## HTTPS (Docker)

When using Docker, the app runs behind Nginx, which handles secure (HTTPS) connections. Any plain HTTP request is
automatically redirected to HTTPS. You can change the server's address via the `SERVER_NAME` environment variable
(defaults to `localhost`).

### Development

On first start, a `cert-generator` init container uses `openssl` to create a self-signed certificate for `localhost`
and stores it in a Docker volume. The certificate persists across restarts.

Because the certificate is self-signed, your browser will show a security warning on the first visit. Proceed through it
once (or add a permanent exception) and subsequent requests will work without interruption.

### Production

1. Set `SERVER_NAME` to your domain in the host environment or a `.env` file at the repo root:
   ```env
   SERVER_NAME=example.com
   ```
2. Place your real certificate and private key at `./nginx/certs/server.crt` and `./nginx/certs/server.key`.
3. Start the stack with the production override:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

If `SERVER_NAME` is not set, the production compose file will refuse to start.

## API Reference

Interactive API documentation is available via Swagger UI when running in development: http://localhost:3000/api

All routes, request bodies, query parameters, and response schemas are documented there. Swagger is not available in
production.

## ABN AMRO integration

The integration uses
the [ABN AMRO Account Information PSD2 API](https://developer.abnamro.com/api-products/account-information-psd2). It
implements the **OAuth2 authorization code flow**, which requires explicit customer consent before any account data can
be retrieved.

### Sandbox limitations and workarounds

#### Fixed redirect URI

The ABN AMRO sandbox hardcodes the OAuth2 redirect URI to `https://localhost/auth`. This value **cannot be changed** for
sandbox applications — the developer portal does not allow registering a different URI for sandbox apps.

Nginx listens on port `443` and proxies to the server, so `https://localhost/auth` is handled directly by the `/auth`
endpoint. On success the server stores the token in the database (encrypted) and returns a confirmation:

```json
{
  "message": "Authorization successful. You may now sync transactions."
}
```

The token is now persisted in the database and survives server restarts, so the OAuth2 flow only needs to be completed
once per bank account.

### Setup

#### 1. Register on the developer portal

1. Create an account at [developer.abnamro.com](https://developer.abnamro.com).
2. Go to **My Apps** and create a new application.
3. Subscribe the app to the **Account Information PSD2** API product.
4. After saving, the portal shows your **API key**. Copy it into `ABN_AMRO_API_KEY`.

For sandbox testing, the `client_id` is always `TPP_test`.

#### 2. Configure the certificate

Place your certificate and private key files somewhere accessible to the server (e.g., in `apps/server/certs/`) and
update the paths in `.env`:

```env
ABN_AMRO_CERT_PATH=./certs/tpp.crt
ABN_AMRO_KEY_PATH=./certs/tpp.key
```

When both variables are set the server attaches the certificate to every token request via an `https.Agent`.

## Running tests

```bash
# E2E tests
npm run test:e2e
```
