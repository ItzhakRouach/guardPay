import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
} from "@expo-google-fonts/cormorant-garamond";
import {
  FrankRuhlLibre_400Regular,
  FrankRuhlLibre_500Medium,
  FrankRuhlLibre_700Bold,
} from "@expo-google-fonts/frank-ruhl-libre";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { I18nManager } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoadingSpinner from "../components/common/LoadingSpinnner";
import { AuthProvider, useAuth } from "../hooks/auth-context";
import { LanguageProvider } from "../hooks/lang-context";
import { ThemeProvider, useThemeMode } from "../hooks/theme-context";
import { darkTokens, legacyAlias, lightTokens } from "../lib/theme";
import "../translations/il18n";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldShowBanner: true,
    shouldSetBadge: true,
  }),
});

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightTokens,
    ...legacyAlias(lightTokens),
    background: lightTokens.bg,
    surface: lightTokens.surface,
    onSurface: lightTokens.ink,
    primary: lightTokens.cta,
    onPrimary: lightTokens.ctaInk,
    outline: lightTokens.border,
    outlineVariant: lightTokens.borderSoft,
    error: lightTokens.neg,
    secondaryContainer: lightTokens.accentSoft,
    onSecondaryContainer: lightTokens.cta,
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkTokens,
    ...legacyAlias(darkTokens),
    background: darkTokens.bg,
    surface: darkTokens.surface,
    onSurface: darkTokens.ink,
    primary: darkTokens.cta,
    onPrimary: darkTokens.ctaInk,
    outline: darkTokens.border,
    outlineVariant: darkTokens.borderSoft,
    error: darkTokens.neg,
    secondaryContainer: darkTokens.accentSoft,
    onSecondaryContainer: darkTokens.accent,
  },
};

function RouteGuard({ children }) {
  const router = useRouter();
  const { user, isLoadingUser, profile } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoadingUser) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inSetupScreen = segments[1] === "setupPrefs";
    if (!user) {
      if (!inAuthGroup) {
        router.replace("/onBoarding");
      }
    } else if (user && !profile) {
      if (!inSetupScreen) {
        router.replace("/setupPrefs");
      }
    } else if (user && inAuthGroup && profile) {
      router.replace("/(tabs)");
    }
  }, [user, segments, isLoadingUser, profile]);

  if (isLoadingUser) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}

try {
  if (I18nManager.isRTL) {
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
  }
} catch (e) {
  console.log(e);
}

function ThemedApp() {
  const { scheme } = useThemeMode();
  const isDark = scheme === "dark";
  const theme = isDark ? darkTheme : lightTheme;
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        <RouteGuard>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: theme.colors.bg,
                },
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="add-shift"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="paycheck"
                options={{ presentation: "modal" }}
              />
            </Stack>
          </GestureHandlerRootView>
        </RouteGuard>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    FrankRuhlLibre_400Regular,
    FrankRuhlLibre_500Medium,
    FrankRuhlLibre_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!fontsLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
