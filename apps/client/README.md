# PocketFlow

PocketFlow is a personal expense tracker app with biometric security and local storage. This is a prototype using React
Native and Expo with Expo SQLite.

---

## Features

- **Add transactions** — log new income or expense entries with a title, amount, date, and type toggle
- **Edit transactions** — tap any transaction to update its title or amount
- **Delete transactions** — swipe left on a transaction to delete
- **Persistent local storage** — all data is stored locally using SQLite via `expo-sqlite`
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
