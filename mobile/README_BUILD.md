GeniDoc Mobile — Build & Release Guide

This document explains how to produce installable Android/iOS builds for the Expo-managed `mobile/` app.

Prerequisites

- Install Node.js (>=18 recommended)
- Install `expo` / `eas` CLI when needed:
  - `npm install -g expo-cli` (optional)
  - `npm install -g eas-cli` (recommended for EAS builds)
- Create an Expo account (https://expo.dev) for EAS builds
- For local Android builds, install Android Studio and SDK
- For iOS builds, use macOS + Xcode (or use EAS build)

Configure backend connection

- The app expects the backend URL to be provided via `process.env.BACKEND_URL` or defaults to `http://10.0.2.2:3000`.
- Create `mobile/.env` locally (do NOT commit) following `.env.example` and set `BACKEND_URL` to your machine LAN address (e.g. `http://192.168.1.34:3000`) when testing on a real device.

Local testing (Expo Go)

1. From the `mobile/` folder:
   ```powershell
   cd mobile
   npm install
   npx expo start
   ```
2. For Android emulator use `http://10.0.2.2:3000` as backend. For iOS simulator on macOS, use `http://localhost:3000`.
3. For real devices, use your machine LAN IP and set `BACKEND_URL` accordingly.

Build options

A) Quick APK (preview) via EAS (recommended)

1. Login to EAS:
   ```powershell
   cd mobile
   eas login
   ```
2. Configure `eas.json` (recommended profiles) and then:
   ```powershell
   eas build -p android --profile preview
   ```
3. Download the produced APK from the EAS build page and install on device.

B) Local Android build (requires native toolchain)

1. Prebuild native project:
   ```powershell
   npx expo prebuild
   ```
2. Open the Android project in Android Studio and build an APK or AAB.

C) iOS

- Use EAS build for iOS unless you have macOS/Xcode and provisioning profiles. EAS will handle credentials if you provide them.

Notes on signing & credentials

- For production builds you will need keystore (Android) and provisioning profiles (iOS). EAS can manage these for you.

PWA alternative (no store)

- The website is PWA-enabled. If you prefer not to publish to stores, make the web build and host it over HTTPS. Users can then add the PWA to home screen.

CI / Automation

- You can create a GitHub Action to run `eas build` on push to `main` and store artifacts. See Expo docs for example workflows.

If you'd like, I can:

- Add a sample `eas.json` and `android/ios` build profiles to the repo.
- Prepare a GitHub Action YAML for automated EAS builds.
- Help you run a local prebuild and produce an unsigned APK (you must run locally for native toolchain steps).
