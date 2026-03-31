# PocketFlow

A personal finance application with a NestJS backend and a React Native (Expo) mobile client.

## Prerequisites

- Node.js 22 (or higher)
- npm 10 (or higher)
- Docker and Docker Compose

## Setup

### Server

Copy the example env file in `apps/server/` and fill in your values:

```bash
cp apps/server/.env.example apps/server/.env
```

Two values must be set before the server will start:

- **`ENCRYPTION_KEY`**: a 64-character hex string (32 bytes). Generate one with:
  ```bash
  openssl rand -hex 32
  ```
- **`JWT_SECRET`**: a long, random string used to sign tokens. Change the placeholder in `.env.example`.

The database variables (`DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`) already have working defaults for the
Docker Compose stack. Change them only if you need different credentials.

#### ABN AMRO

Transaction import from ABN AMRO requires a developer account. Register
at [developer.abnamro.com](https://developer.abnamro.com), create an app, and subscribe to the
**Account Information PSD2** product to get an API key.

For sandbox use, set these in `.env`:

```env
ABN_AMRO_CLIENT_ID=TPP_test
ABN_AMRO_API_KEY=<your key>
ABN_AMRO_REDIRECT_URI=https://localhost/auth
```

See [apps/server/README.md](apps/server/README.md) for the full OAuth2 flow and setup for production.

### Client

The client API base URL is hardcoded in [apps/client/lib/api.ts](apps/client/lib/api.ts):

```ts
const BASE_URL = "http://10.0.2.2:3000/api/v1";
```

`10.0.2.2` is the Android emulator's alias for the host machine. Change this if you are running on a physical device or
iOS simulator.

Install the client dependencies:

```bash
cd apps/client && npm install
```

## Running

### Server

From the repo root:

```bash
docker compose up
```

The API is available at `https://localhost/api/v1`. Port `3000` is also exposed directly for use with the Android
emulator.

### Client

```bash
cd apps/client && npm start
```

Scan the QR code with the Expo Go app, or press `a` for the Android emulator or `i` for the iOS simulator.

## Test User Credentials

| Field    | Regular user       | Administrator       |
|----------|--------------------|---------------------|
| Email    | `test@example.com` | `admin@example.com` |
| Password | `password123`      | `password123`       |
| Admin    | `false`            | `true`              |
