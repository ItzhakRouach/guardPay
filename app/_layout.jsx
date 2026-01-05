import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth-context";
const theme = {
  ...MD3LightTheme,
  dark: false, // This is the key to stopping "Strict" mode changes
  colors: {
    ...MD3LightTheme.colors,
    primary: "#213448",
    background: "#F8FAFC",
    surface: "#FFFFFF",
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
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <RouteGuard>
            <GestureHandlerRootView>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="add-shift"
                  options={{
                    headerShown: true,
                    presentation: "modal",
                    headerTitle: "Add New Shift",
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
