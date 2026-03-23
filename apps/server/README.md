# PocketFlow Server

NestJS REST API with PostgreSQL for managing users, transactions, categories, and tags. Includes integration with the
ABN AMRO sandbox API to import transactions.

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

The API is available at `http://localhost:3000/api`.

## API Reference

All routes are prefixed with `/api`.

### Users

| Method   | Path                              | Description                  |
|----------|-----------------------------------|------------------------------|
| `POST`   | `/api/users`                      | Create a user                |
| `GET`    | `/api/users`                      | List all users               |
| `GET`    | `/api/users/:id`                  | Get a user by ID             |
| `PATCH`  | `/api/users/:id`                  | Update a user                |
| `DELETE` | `/api/users/:id`                  | Delete a user                |
| `GET`    | `/api/users/:id/transactions`     | List transactions for a user |

### Categories

| Method   | Path                  | Description          |
|----------|-----------------------|----------------------|
| `POST`   | `/api/categories`     | Create a category    |
| `GET`    | `/api/categories`     | List all categories  |
| `GET`    | `/api/categories/:id` | Get a category by ID |
| `PATCH`  | `/api/categories/:id` | Update a category    |
| `DELETE` | `/api/categories/:id` | Delete a category    |

### Tags

| Method   | Path            | Description     |
|----------|-----------------|-----------------|
| `POST`   | `/api/tags`     | Create a tag    |
| `GET`    | `/api/tags`     | List all tags   |
| `GET`    | `/api/tags/:id` | Get a tag by ID |
| `PATCH`  | `/api/tags/:id` | Update a tag    |
| `DELETE` | `/api/tags/:id` | Delete a tag    |

### Transactions

| Method   | Path                                  | Description                          |
|----------|---------------------------------------|--------------------------------------|
| `POST`   | `/api/transactions`                   | Create a transaction                 |
| `GET`    | `/api/users/:userId/transactions`     | List transactions for a user         |
| `GET`    | `/api/transactions/:id`               | Get a transaction by ID              |
| `PATCH`  | `/api/transactions/:id`               | Update a transaction                 |
| `DELETE` | `/api/transactions/:id`               | Delete a transaction                 |

### ABN AMRO

| Method | Path                      | Description                                                              |
|--------|---------------------------|--------------------------------------------------------------------------|
| `GET`  | `/api/abn-amro/authorize` | Redirect to the ABN AMRO consent page                                    |
| `GET`  | `/api/abn-amro/callback`  | Receive the authorization code from ABN AMRO and exchange it for a token |
| `POST` | `/api/abn-amro/sync`      | Fetch transactions from ABN AMRO and persist them                        |

Query parameters for `/api/abn-amro/sync`:

- `accountNumber` (required): IBAN of the account to fetch transactions from
- `userId` (optional): Assign imported transactions to this user ID
- `categoryId` (optional): Assign imported transactions to this category ID

## Example requests

### Sync from ABN AMRO

```bash
# 1. Open in a browser — redirects to the ABN AMRO consent page
open http://localhost:3000/api/abn-amro/authorize

# 2. After granting consent ABN AMRO redirects to https://localhost/auth?code=<code>
#    The browser will show an error (nothing listens there); that is expected.
#    Copy the code= value from the address bar and exchange it for a token:
curl "http://localhost:3000/api/abn-amro/callback?code=<authorization_code>"
#    The response includes the access token. Save it in ABN_AMRO_ACCESS_TOKEN
#    in .env so you do not have to repeat the OAuth2 flow on the next restart.

# 3. Sync transactions
curl -X POST "http://localhost:3000/api/abn-amro/sync?accountNumber=NL12ABNA9999876523&userId=<uuid>&categoryId=<uuid>"
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

As a result, after the user grants consent, the browser is redirected to `https://localhost/auth?code=<code>`, which
will fail with a connection error because nothing is listening there. This is expected. To complete the flow:

1. Copy the value of the `code` query parameter.
2. Call the callback endpoint manually, passing that code:
   ```bash
   curl "http://localhost:3000/api/abn-amro/callback?code=<code>"
   ```
3. The response contains the access token:
   ```json
   { "message": "Authorization successful. You may now sync transactions.", "accessToken": "eyJ..." }
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
