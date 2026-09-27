import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

// OTA updates used to apply silently on the SECOND launch after publishing
// (downloaded on one launch, run on the next). This checks when the app
// opens or returns to the foreground, downloads in the background, and
// exposes `ready` so a banner can offer an immediate restart.
//
// No-op in development and in builds where updates are disabled (dev
// client), where checkForUpdateAsync would throw.

const MIN_INTERVAL_MS = 15 * 60 * 1000;

export function useOtaUpdates() {
  const [ready, setReady] = useState(false);
  const lastCheck = useRef(0);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) return;
    if (busy.current) return;
    if (Date.now() - lastCheck.current < MIN_INTERVAL_MS) return;
    busy.current = true;
    lastCheck.current = Date.now();
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        setReady(true);
      }
    } catch (e) {
      // Offline, paused backend, or a transient CDN error: allow the next
      // foreground to try again immediately instead of in 15 minutes.
      console.log("[updates] check failed:", e?.message);
      lastCheck.current = 0;
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => sub.remove();
  }, [check]);

  const restart = useCallback(async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.log("[updates] reload failed:", e?.message);
    }
  }, []);

  const dismiss = useCallback(() => setReady(false), []);

  return { ready, restart, dismiss };
}
