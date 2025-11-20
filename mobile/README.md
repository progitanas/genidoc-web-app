# GeniDoc Mobile (Expo)

This folder contains a minimal Expo-managed React Native app scaffold for GeniDoc. It is an MVP to run locally, connect to the existing backend APIs and produce Android/iOS builds via Expo/EAS.

Quick start (PowerShell):

```powershell
cd mobile
npm install
# install expo CLI globally if you don't have it
npx expo start
```

Notes about connecting to backend:

- When running on Android emulator, use `http://10.0.2.2:3000` as backend host.
- When running on a real device via Expo, use your machine LAN IP (e.g. `http://192.168.1.34:3000`).

Building releases:

- Use Expo Application Services (EAS) for modern builds: https://docs.expo.dev/eas/
- Or use `expo run:android` / `expo run:ios` for local builds (requires native toolchains).
