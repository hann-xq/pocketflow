# PocketFlow

PocketFlow is a personal expense tracker with biometric security, offline-first data access, and a NestJS backend.

---

## Features

- **Add transactions** — log new income or expense entries with amount, date, category, and counterparty
- **Edit transactions** — update amount, counterparty, category, and tags
- **Delete transactions** — swipe left on a transaction to delete
- **Offline-first** — all data is available offline; writes are queued and synced on reconnect
- **Accessibility** — screen reader support (accessibility labels, roles, and hints on interactive elements)
- **Dark mode support** — respects the device's light/dark mode preference

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — install with `npm install -g expo-cli`
- A device or emulator to run the app:
    - **Android**: Android Studio with an emulator, or a physical Android device
    - **iOS**: Xcode with a simulator (macOS only), or a physical iOS device
    - **Expo Go**: install the [Expo Go](https://expo.dev/go) app on your phone for the quickest start

---

## Running the prototype

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npx expo start
   ```

3. **Open the app**. After the server starts, choose one of the following options from the terminal output:

   | Option                     | Command / Action                      |
   |----------------------------|---------------------------------------|
   | Android emulator           | Press `a` in the terminal             |
   | iOS simulator (macOS only) | Press `i` in the terminal             |
   | Physical device            | Scan the QR code with the Expo Go app |

---

## Testing

The client uses two complementary testing frameworks with distinct responsibilities:

|                   | Component tests                       | E2E tests                                    |
|-------------------|---------------------------------------|----------------------------------------------|
| **Framework**     | Jest + React Native Testing Library   | Maestro                                      |
| **What it tests** | Individual UI components in isolation | Full user flows on a real device or emulator |
| **Runs in**       | Node.js (no device required)          | Physical device or emulator                  |
| **Speed**         | Fast                                  | Slow                                         |
| **Coverage goal** | Every component                       | Critical user flows only                     |

### Component tests (Jest + React Native Testing Library)

Component tests render components in a simulated environment and verify their behavior from the user's perspective:
what is displayed, what happens when the user interacts with it. They do not test platform-specific native code.

Use component tests for all components. Because they run in Node.js without a device, they are fast enough to run on
every commit and in CI.

#### Execution

```bash
# Run all component tests
npm test

# Run in watch mode (re-runs on file change)
npm test -- --watch
```

### E2E tests (Maestro)

E2E tests run the full application on a real device or emulator and drive it the same way a user would: tapping, typing,
and asserting what is visible on screen. They give the highest confidence that the app works end-to-end but are slower
and more prone to flakiness.

Use E2E tests only for complicated user flows where the value of catching integration issues outweighs the cost of
maintenance: authentication, navigation between screens, and any flow that spans multiple components or API calls.

Flow files live in `.maestro/` as YAML files.

E2E tests are not run in CI. Running them requires compiling a native build (which takes several minutes), an Android
emulator, a running server via Docker Compose, and the Maestro CLI; none of which are practical in a CI environment.
They must be run locally before merging any change that touches a covered flow.

#### Setup

1. Set up the Maestro Studio. Follow the [QuickStart](https://docs.maestro.dev/get-started/quickstart) documentation.
2. Start the server application using Docker Compose.
3. Start the app in a **release build** (which does not support hot reloading) on a connected device or emulator.
   Maestro tests against `appId: com.pocketflow.app`, so the app must be installed:

   ```bash
   npm run android:build   # builds and installs on the connected device
   ```

> Be aware that Maestro may not be compatible with the latest version of Android SDK and Expo Go. The current tested
> version of Android SDK is 35. The NDK version is 27.1.12297006. And the required Gradle version is 8.13.x. Different
> configuration may cause unexplainable errors and behavior.

---

## Offline-First Architecture

TanStack Query is the single source of truth for all data. SQLite (via Drizzle ORM) serves two purposes: persisting the
TQ cache across app restarts and storing a write queue for mutations made while offline.

### Reads

On first launch (online), queries fetch from the API and TQ caches the results. `PersistQueryClientProvider` immediately
serialises the entire cache to a single row in the `query_cache` SQLite table. On every subsequent launch — online or
offline — the cache is restored before any screen renders, so data is visible instantly with no loading state.

All queries use `networkMode: 'always'`, so TQ serves the cache regardless of connectivity. When back online, `useSync`
triggers `invalidateQueries` to refresh stale data.

### Writes

All mutations go through `useOfflineMutation` (`hooks/useOfflineMutation.ts`), which handles branching centrally:

- `onMutate` always runs first and applies an **optimistic update** to the TQ cache, so the UI reflects the change
  immediately.
- **Online path:** `mutationFn` calls the API. `onApiSuccess` reconciles the server response, replacing any temp ID with
  the server-assigned ID.
- **Offline path:** `mutationFn` returns `{ source: 'offline' }`. `onOfflineSuccess` inserts a row into the
  `pending_operations` SQLite table.
- If the API call throws while the device is offline (race condition), the hook rechecks connectivity and falls back to
  the offline path instead of reverting the optimistic update.
- On error while still online, `onError` reverts the cache.

### Reconnect sync

When connectivity is restored, `useSync` calls `flushPendingQueue` (`lib/pending-queue.ts`), which:

1. Loads all pending ops and processes them **sequentially in FIFO order** — order matters because the same entity can
   be modified multiple times.
2. For **create** ops: posts to the API and replaces the temp-ID item in the TQ cache with the server response.
3. For **update** ops: first GETs the current entity from the API to compare its `updatedAt` against `op.createdAt`. If
   the server version is newer, the local op is stale and skipped. If the entity returns 401/403/404, it has been
   deleted — remove it from cache.
4. For **delete** ops: calls the API delete endpoint.
5. On failure: logs the error, wipes only that entity type's query from the cache (it will refetch fresh), and continues
   processing remaining ops.
6. Shows a single alert at the end if any op failed.
7. After flushing, calls `invalidateQueries` for all entity keys.

### Key files

| Path                          | Purpose                                                                     |
|-------------------------------|-----------------------------------------------------------------------------|
| `db/schema.ts`                | Drizzle schema — `query_cache` and `pending_operations` tables              |
| `db/client.ts`                | SQLite + Drizzle singleton                                                  |
| `db/migrations.ts`            | Migration runner (must complete before `PersistQueryClientProvider` mounts) |
| `lib/sqlite-persister.ts`     | TQ `Persister` — serialises the full cache as one JSON blob                 |
| `lib/network.ts`              | `configureOnlineManager()` wires NetInfo to TQ; `useIsOnline()` hook        |
| `lib/pending-queue.ts`        | `flushPendingQueue` — reconnect sync                                        |
| `lib/validation.ts`           | Client-side validation for transactions, bank accounts, IBAN, and tag names |
| `lib/cache-helpers.ts`        | Builds optimistic `ApiTransaction` shapes from form input                   |
| `hooks/useOfflineMutation.ts` | Base mutation hook with online/offline branching                            |
| `hooks/useSync.ts`            | Reconnect handler — flush queue then invalidate                             |

### Testing offline behaviour

1. Enable airplane mode on the device or emulator.
2. Open the app — data loads from the persisted cache with no API calls.
3. Create, edit, or delete a transaction — the change appears immediately (optimistic update).
4. Disable airplane mode — the op is flushed to the API, the row is deleted, and fresh data is fetched.

---
