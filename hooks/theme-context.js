import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

// User-facing color-scheme control. `mode` can be:
//   "auto"  — follow the system setting (default for first-time users)
//   "light" — force light theme regardless of system
//   "dark"  — force dark theme regardless of system
//
// `scheme` is the *resolved* "light" | "dark" the rest of the app should
// use when deciding which palette to apply.
const ThemeContext = createContext({
  mode: "auto",
  scheme: "light",
  setMode: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "user-color-scheme";

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState("auto");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "auto") {
          setModeState(saved);
        }
      } catch (e) {
        console.log("Failed to load color-scheme preference:", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setMode = async (next) => {
    setModeState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      console.log("Failed to save color-scheme preference:", e);
    }
  };

  const scheme =
    mode === "auto" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  // Toggle helper: a single tap flips between explicit light and dark.
  // Resets the "auto" fence as soon as the user expresses a preference;
  // they can clear it back to auto via the long-press handler (not used
  // yet — leaving the door open).
  const toggle = () => setMode(scheme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ mode, scheme, setMode, toggle, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeContext);
