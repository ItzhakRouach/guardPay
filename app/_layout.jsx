import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth-context";

//setup the notfication behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldShowBanner: true,
    shouldSetBadge: true,
  }),
});

/** Creating colors for dark and light modes */
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    //#F8FAFC -> Main App Background
    background: "#F4F4F4",

    //Primary brand color (buttons , Titles , labels)
    primary: "#213448",
    onPrimary: "#fff",

    //Surface of Cards and TextInputs
    surface: "#FFFFFF",
    onSurface: "#213448",
    card: "#F8FAFC",

    //Profile Sections colors
    profileSection: "#7D7D7D",

    //Borders and Muted lines
    outline: "#E2E8F0",
    outlineVariant: "#F1F5F9",

    //Errors / Warning
    error: "#B91C1C",

    // Selected states for SegmentedButtons
    secondaryContainer: "#E0E7FF",
    onSecondaryContainer: "#213448",

    //border color
    borderOutline: "#cbd5e1",
    dateText: "#64748B",
    divider: "#213448",
    summary: "#64748B",
    editBtn: "#3b82f6",
    delBtn: "#ef4444",
  },
};

// Define  Specific Dark Theme
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // #0F172A -> Deep Navy App Background
    background: "#0F172A",
    card: "#163059ff",

    // Primary accent color (Sky blue for visibility in Dark Mode)
    primary: "#38BDF8",
    onPrimary: "#0F172A",

    // Surface of Cards, TextInputs, and Modal/Pickers
    surface: "#163059ff", // Lighter slate for depth
    onSurface: "#F8FAFC", // Off-white text

    // Borders and Muted lines
    outline: "#334155",
    outlineVariant: "#475569",

    // Errors / Warning
    error: "#F87171", // Lighter red for dark mode contrast

    // Selected states for SegmentedButtons
    secondaryContainer: "#3a5e91ff",
    onSecondaryContainer: "#38BDF8",

    //Profile Sections colors
    profileSection: "#38BDF8",
    // Custom Mapping
    borderOutline: "#475569",
    dateText: "#94A3B8", // Muted gray-blue
    divider: "#38BDF8",
    summary: "#ffffffff", // Muted label color
    editBtn: "#60A5FA", // Lighter blue
    delBtn: "#F87171", // Lighter red
  },
};

function RouteGuard({ children }) {
  const router = useRouter();
  const { user, isLoadingUser, profile } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    //first check if user is still in loading phase
    if (isLoadingUser) return;

    //set the auth loc
    const inAuthGroup = segments[0] === "(auth)";

    if (!user) {
      if (!inAuthGroup) {
        router.replace("/onBoarding");
      }
      // if the user dosent allready set his profile
    } else if (user && !profile) {
      if (segments[1] !== "setupPrefs") {
        router.replace("/setupPrefs");
      }
      //if the use is logged in and allready set his profile then redirect to the app.
    } else if (user && inAuthGroup && profile) {
      router.replace("/(tabs)");
    }
  }, [user, segments, isLoadingUser, profile]);
  return <>{children}</>;
}

export default function RootLayout() {
  // detect system theme
  const colorScheme = useColorScheme();

  // apply theme based on the system theme Dark / Light
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          <RouteGuard>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  headerShown: true,
                }}
              >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="add-shift"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                    headerTitle: "Add New Shift",
                  }}
                />
                <Stack.Screen
                  name="edit-profile"
                  options={{
                    headerShown: false,
                    presentation: "modal",
                  }}
                />
              </Stack>
            </GestureHandlerRootView>
          </RouteGuard>
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
