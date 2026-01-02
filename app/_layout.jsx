import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth-context";

function RouteGuard({ children }) {
  const router = useRouter();
  const { user, isLoadingUser, profile } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    //first check if user is still in loading phase
    if (isLoadingUser) return;

    //set the auth loc
    const inAuthGroup = segments[0] === "auth";
    if (!user) {
      if (!inAuthGroup) {
        router.replace("/auth/onBoarding");
      }
      // if the user dosent allready set his profile
    } else if (user && !profile) {
      if (segments[1] !== "setupPrefs") {
        router.replace("/auth/setupPrefs");
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
      <PaperProvider>
        <SafeAreaProvider>
          <RouteGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </RouteGuard>
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
