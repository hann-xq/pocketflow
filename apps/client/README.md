# PocketFlow

PocketFlow is a personal expense tracker app with biometric security and local storage. This is a prototype using React Native and Expo with Expo SQLite.

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

3. **Open the app** — after the server starts, choose one of the following options from the terminal output:

   | Option | Command / Action |
   |--------|-----------------|
   | Android emulator | Press `a` in the terminal |
   | iOS simulator (macOS only) | Press `i` in the terminal |
   | Physical device | Scan the QR code with the Expo Go app |

---
