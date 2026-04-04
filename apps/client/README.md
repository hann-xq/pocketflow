# PocketFlow

PocketFlow is a personal expense tracker with biometric security, offline-first data access, and a NestJS backend.

## Prerequisites

- Node.js 22 (or higher)
- Expo CLI (install with `npm install -g expo-cli`)
- A device or emulator to run the app:
    - **Android**: Android Studio with an emulator, or a physical Android device
    - **iOS**: Xcode with a simulator (macOS only), or a physical iOS device

## Running the prototype

1. **Install dependencies**: `npm install`
2. **Start the development server**: `npx expo start` (use `--device` for testing a real device)
3. **Open the app**. After the server starts, choose one of the following options from the terminal output:

   | Option                     | Command / Action                      |
   |----------------------------|---------------------------------------|
   | Android emulator           | Press `a` in the terminal             |
   | iOS simulator (macOS only) | Press `i` in the terminal             |

## Testing

### Component tests (Jest + React Native Testing Library)

Component tests render components in a simulated environment and verify their behavior from the user's perspective:
what is displayed, what happens when the user interacts with it. They do not test platform-specific native code.
[[1]](#1)

Use component tests for all components. Because they run in Node.js without a device, they are fast enough to run on
every commit and in CI. [[1]](#1)

#### Execution

```bash
# Run all component tests
npm run test
```

### E2E tests (Maestro)

E2E tests run the full application on a real device or emulator and drive it the same way a user would: tapping, typing,
and asserting what is visible on screen. They give the highest confidence that the app works end-to-end but are slower
and more prone to flakiness. [[1]](#1)

Use E2E tests only for complicated user flows where the value of catching integration issues outweighs the cost of
maintenance: authentication, navigation between screens, and any flow that spans multiple components or API calls.
[[1]](#1)

Flow files live in `maestro/` as YAML files.

E2E tests are not run in CI. Running them requires compiling a native build (which takes several minutes), an Android
emulator, a running server via Docker Compose, and the Maestro CLI; none of which are practical in a CI environment.
They must be run locally before merging any change that touches a covered flow.

#### Setup

1. Set up the Maestro Studio. Follow the [QuickStart](https://docs.maestro.dev/get-started/quickstart) documentation.
2. Start the server application using Docker Compose.
3. Start the app in a **development build** on a connected device or emulator. Maestro tests against
   `appId: com.pocketflow.app`, so the app must be installed: `npm run android:build`

> Be aware that Maestro may not be compatible with the latest version of Android SDK and Expo Go. The current tested
> version of Android SDK is 35. The NDK version is 27.1.12297006. And the required Gradle version is 8.13.x. Different
> configuration may cause unexplainable errors and behavior.

---

## Offline-First Architecture

TanStack Query is the single source of truth for all data. SQLite (via Drizzle ORM) serves two purposes: persisting the
TQ cache across app restarts and storing a write queue for mutations made while offline.

### Writes

All mutations go through `useOfflineMutation` (`hooks/useOfflineMutation.ts`), which handles branching centrally:

- `onMutate` always runs first and applies an **optimistic update** to the TQ cache, so the UI reflects the change
  immediately.
- **Online path:** `mutationFn` calls the API. `onApiSuccess` handles the server response.
- **Offline path:** `mutationFn` returns `offline` for `source`. `onOfflineSuccess` inserts a row into the
  `pending_operations` SQLite table.
- If the API call throws while the device is offline (race condition), the hook rechecks connectivity and falls back to
  the offline path instead of reverting the optimistic update.
- On error while still online, `onError` reverts the cache.

### Reconnect sync

When connectivity is restored, `useSync` calls `flushPendingQueue` (`lib/pending-queue.ts`), which:

1. Loads all pending operations and processes them **sequentially in FIFO order**. The order matters because the same entity
   can be modified multiple times.
2. For **create** operations: posts to the API and replaces the temporary item in the cache with the server response.
3. For **update** operations: first GETs the current entity from the API to compare its `updatedAt` against
   `op.createdAt`. If the server version is newer, the local op is stale and skipped. If the entity returns 401/403/404,
   it has been deleted; remove it from the cache.
4. For **delete** operations: calls the API delete endpoint.
5. On failure: logs the error, wipes only that entity type's query from the cache (it will refetch fresh), and continues
   processing remaining operations.
6. Shows a single alert at the end if any op failed.
7. After flushing, calls `invalidateQueries` for all entity keys.

---

<a id="1">[1]</a>: “Testing · React Native,” reactnative.dev. https://reactnative.dev/docs/testing-overview
