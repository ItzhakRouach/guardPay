---
name: expo-upgrader
description: Safely upgrade Expo SDK and React Native versions. Use when the user wants to bump Expo, RN, or a major dependency (e.g. expo-router). Walks changelog scan → dependency alignment → EAS profile check → smoke test.
---

# expo-upgrader

GuardPay currently runs Expo `~54` / React Native `0.81` / React `19.1`. Upgrade carefully — this app uses `newArchEnabled: true`, `experiments.reactCompiler: true`, and native tabs (`expo-router/unstable-native-tabs`), all of which have moved fast.

## When invoked

Follow these steps in order. Do not skip.

### 1. Confirm the target version
Ask the user (or infer from their prompt): which Expo SDK? Which RN? Patch bump or major?

Read [package.json](package.json) and [app.json](app.json) → record current versions.

### 2. Scan changelogs
Use WebFetch on:
- `https://expo.dev/changelog` — find the target SDK's release notes
- `https://github.com/expo/expo/blob/main/CHANGELOG.md`
- For RN: `https://github.com/facebook/react-native/releases`
- For expo-router: `https://github.com/expo/expo/tree/main/packages/expo-router`

Look for breaking changes touching anything GuardPay uses:
- `expo-router` (especially `unstable-native-tabs`)
- `expo-notifications` (notification handler signature has changed in past majors)
- `expo-apple-authentication`, `expo-auth-session`, `expo-web-browser`
- `expo-print`, `expo-sharing`
- `react-native-appwrite` (not part of Expo, but check its peer-dep range)
- `react-native-paper` (MD3 token names occasionally shift)
- React 19 → 19.x bumps can affect `react-native-reanimated`

### 3. Run the upgrade
```bash
npx expo install expo@<target>
npx expo install --fix          # aligns peer deps to the SDK
```

For RN bumps that aren't covered by `expo install`, use the official [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) to diff the template.

### 4. Re-run codegen / native rebuild
```bash
npx expo prebuild --clean       # if you have native changes
npm run ios
npm run android
```

Because `newArchEnabled: true`, a clean rebuild is usually required.

### 5. Verify
```bash
npm test           # salary logic should still pass — pure JS, low risk
npm run lint
```

Manually smoke-test (use the `qa` subagent for a full plan):
- Sign in (Google + Apple)
- Add a shift → confirm overview updates via realtime
- Open overview → generate PDF
- Toggle language to Hebrew → confirm copy changes
- Toggle dark mode → confirm theme tokens render

### 6. Update [app.json](app.json) if needed
- `runtimeVersion.policy: "appVersion"` is set — bumping `version` produces a new OTA channel.
- If the target SDK changes the new-architecture default, decide whether to keep `newArchEnabled` explicit.

### 7. EAS check
```bash
eas build:configure  # only if eas.json schema changed
```

Verify [eas.json](eas.json) still parses and the iOS submit config (`appleId`, `ascAppId`, `appleTeamId`) is untouched.

## Common pitfalls in this repo

- **`unstable-native-tabs`** is unstable by name — API has changed in past SDKs. If [app/(tabs)/_layout.jsx](app/(tabs)/_layout.jsx) breaks, check the changelog first.
- **`I18nManager.forceRTL(false)`** in [app/_layout.jsx](app/_layout.jsx) must keep working. RN occasionally changes how RTL is detected.
- **Appwrite function IDs** are hard-coded. Don't touch them during the upgrade.
- **Decimal handling** in the rate input is fragile (known bug). After upgrading `react-native-paper`, smoke-test the rate field.

## Output

Report what changed, what passed, what failed, and what needs manual cloud changes (Appwrite, EAS, App Store Connect).
