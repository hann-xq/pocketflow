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

| Variable                | Description                                                                                                                    |
|-------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `PORT`                  | HTTP port                                                                                                                      |
| `DB_HOST`               | PostgreSQL host                                                                                                                |
| `DB_PORT`               | PostgreSQL port                                                                                                                |
| `DB_USERNAME`           | PostgreSQL user                                                                                                                |
| `DB_PASSWORD`           | PostgreSQL password                                                                                                            |
| `DB_DATABASE`           | Database name                                                                                                                  |
| `ABN_AMRO_API_URL`      | ABN AMRO API base URL                                                                                                          |
| `ABN_AMRO_AUTH_URL`     | Authorization endpoint — browser is redirected here to grant consent                                                           |
| `ABN_AMRO_TOKEN_URL`    | Token endpoint — used to exchange the authorization code for an access token                                                   |
| `ABN_AMRO_CLIENT_ID`    | Your ABN AMRO client ID. Use `TPP_test` for sandbox testing                                                                    |
| `ABN_AMRO_API_KEY`      | API key sent on every request (`API-Key` header) — [see ABN AMRO setup](#1-register-on-the-developer-portal)                   |
| `ABN_AMRO_CERT_PATH`    | Path to your mTLS certificate (PEM). Optional in sandbox, required in production                                               |
| `ABN_AMRO_KEY_PATH`     | Path to your mTLS private key (PEM). Optional in sandbox, required in production                                               |
| `ABN_AMRO_REDIRECT_URI` | OAuth2 redirect URI. The sandbox hardcodes `https://localhost/auth` and it cannot be changed in the developer portal           |
| `ABN_AMRO_SCOPE`        | OAuth2 scopes to request                                                                                                       |
| `ABN_AMRO_ACCESS_TOKEN` | Pre-configured access token — skips the OAuth2 flow if set. Obtain one by completing the flow and copying it from the response |

## Seeding

Populate the database with a test user, categories, and tags:

```bash
# Locally
npm run seed

# Docker (runs once and exits)
docker compose run --rm seeder
```

The command is idempotent — it skips records that already exist.

### Test user credentials

| Field    | Value              |
|----------|--------------------|
| Email    | `test@example.com` |
| Password | `password123`      |

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

All routes are prefixed with `/api/v1`, except the ABN AMRO routes which are served at the root.

### Users

| Method   | Path                              | Description                   |
|----------|-----------------------------------|-------------------------------|
| `POST`   | `/api/v1/users`                   | Create a user                 |
| `GET`    | `/api/v1/users`                   | List all users                |
| `GET`    | `/api/v1/users/:id`               | Get a user by ID              |
| `PATCH`  | `/api/v1/users/:id`               | Update a user                 |
| `DELETE` | `/api/v1/users/:id`               | Delete a user                 |
| `GET`    | `/api/v1/users/:id/bank-accounts` | List bank accounts for a user |
| `GET`    | `/api/v1/users/:id/transactions`  | List transactions for a user  |

**Create / Update body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Bank Accounts

| Method   | Path                                     | Description                          |
|----------|------------------------------------------|--------------------------------------|
| `POST`   | `/api/v1/bank-accounts`                  | Create a bank account                |
| `GET`    | `/api/v1/bank-accounts/:id`              | Get a bank account by ID             |
| `PATCH`  | `/api/v1/bank-accounts/:id`              | Update a bank account                |
| `DELETE` | `/api/v1/bank-accounts/:id`              | Delete a bank account                |
| `GET`    | `/api/v1/bank-accounts/:id/transactions` | List transactions for a bank account |

**Create body:**

```json
{
  "accountNumber": "NL01ABNA0417164300",
  "accountName": "Checking",
  "userId": "<uuid>"
}
```

**Update body** (only `accountName` can be changed; `accountNumber` and `userId` are immutable):

```json
{
  "accountName": "Main Account"
}
```

Deleting a bank account cascades and removes all its transactions. Deleting a user cascades and removes all their bank
accounts.

### Categories

| Method   | Path                     | Description          |
|----------|--------------------------|----------------------|
| `POST`   | `/api/v1/categories`     | Create a category    |
| `GET`    | `/api/v1/categories`     | List all categories  |
| `GET`    | `/api/v1/categories/:id` | Get a category by ID |
| `PATCH`  | `/api/v1/categories/:id` | Update a category    |
| `DELETE` | `/api/v1/categories/:id` | Delete a category    |

**Create / Update body:**

```json
{
  "name": "Groceries",
  "description": "Food and household supplies"
}
```

- `description` is optional

### Tags

| Method   | Path               | Description     |
|----------|--------------------|-----------------|
| `POST`   | `/api/v1/tags`     | Create a tag    |
| `GET`    | `/api/v1/tags`     | List all tags   |
| `GET`    | `/api/v1/tags/:id` | Get a tag by ID |
| `PATCH`  | `/api/v1/tags/:id` | Update a tag    |
| `DELETE` | `/api/v1/tags/:id` | Delete a tag    |

**Create / Update body:**

```json
{
  "name": "essential"
}
```

### Transactions

| Method   | Path                       | Description             |
|----------|----------------------------|-------------------------|
| `POST`   | `/api/v1/transactions`     | Create a transaction    |
| `GET`    | `/api/v1/transactions/:id` | Get a transaction by ID |
| `PATCH`  | `/api/v1/transactions/:id` | Update a transaction    |
| `DELETE` | `/api/v1/transactions/:id` | Delete a transaction    |

**Create body:**

```json
{
  "amount": -42.50,
  "date": "2024-01-15",
  "bankAccountId": "<uuid>",
  "description": "Supermarket",
  "counterpartyName": "Albert Heijn",
  "counterpartyAccount": "NL99ABNA0000000001",
  "categoryId": "<uuid>",
  "tagIds": [
    "<uuid>"
  ]
}
```

- `amount`, `date`, and `bankAccountId` are required; all other fields are optional
- Negative `amount` = debit, positive = credit

### ABN AMRO

| Method | Path                    | Description                                                              |
|--------|-------------------------|--------------------------------------------------------------------------|
| `GET`  | `/abn-amro/authorize`   | Redirect to the ABN AMRO consent page                                    |
| `GET`  | `/auth`                 | Receive the authorization code from ABN AMRO and exchange it for a token |
| `POST` | `/api/v1/abn-amro/sync` | Fetch transactions from ABN AMRO and persist them                        |

Query parameters for `/api/v1/abn-amro/sync`:

- `accountNumber` (required): IBAN of the account to fetch transactions from
- `userId` (required): ID of the user who owns the account
- `categoryId` (optional): Assign imported transactions to this category ID

## Example requests

### Sync from ABN AMRO

```bash
# 1. Open in a browser — redirects to the ABN AMRO consent page
open https://localhost/abn-amro/authorize

# 2. Sync transactions
curl -X POST "https://localhost/api/v1/abn-amro/sync?accountNumber=NL12ABNA9999876523&userId=<uuid>&categoryId=<uuid>"
```

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
endpoint. The response contains the access token:

```json
{
  "message": "Authorization successful. You may now sync transactions.",
  "accessToken": "eyJ..."
}
```

#### Persisting the access token across restarts

The token is stored in memory and lost when the server restarts. To avoid repeating the OAuth2 flow every time, copy the
`accessToken` from the callback response into your `.env` file:

```env
ABN_AMRO_ACCESS_TOKEN=eyJ...
```

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
