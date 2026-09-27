import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from "@expo-google-fonts/ibm-plex-sans-arabic";
import {
  IBMPlexSansHebrew_400Regular,
  IBMPlexSansHebrew_500Medium,
  IBMPlexSansHebrew_600SemiBold,
  IBMPlexSansHebrew_700Bold,
} from "@expo-google-fonts/ibm-plex-sans-hebrew";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { I18nManager, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  configureFonts,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoadingSpinner from "../components/common/LoadingSpinnner";
import ErrorBoundary from "../components/layout/ErrorBoundary";
import UpdateBanner from "../components/layout/UpdateBanner";
import ServiceUnavailable from "../components/layout/ServiceUnavailable";
import { AuthProvider, useAuth } from "../hooks/auth-context";
import { LanguageProvider, useLanguage } from "../hooks/lang-context";
import { ShiftsProvider } from "../hooks/shifts-store";
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

// The 25 screens and components that render react-native-paper inherit the
// redesign from here: one font config and one roundness, rather than 25
// rewrites. Paper stays the interaction layer (TextInput, Modal, Switch,
// SegmentedButtons) because the custom primitives have no equivalent.
//
// Two things a flat `config: { fontFamily }` gets wrong, so the config is
// built per variant instead:
//
//  1. MD3 keeps each variant's own `fontWeight`, and titleMedium,
//     titleSmall and the three label variants carry "500". A named iOS
//     face plus a conflicting numeric weight is the classic case where
//     the family silently falls back to San Francisco. Each variant is
//     therefore paired with the real face for its weight and pinned to
//     `fontWeight: "normal"`, so nothing is left to synthesise.
//  2. IBM Plex Sans Hebrew has no Arabic glyphs. Arabic needs its own
//     sibling face, the same rule `components/common/Type.jsx` follows.
const FACES = {
  he: {
    400: "IBMPlexSansHebrew_400Regular",
    500: "IBMPlexSansHebrew_500Medium",
    600: "IBMPlexSansHebrew_600SemiBold",
    700: "IBMPlexSansHebrew_700Bold",
  },
  ar: {
    400: "IBMPlexSansArabic_400Regular",
    500: "IBMPlexSansArabic_500Medium",
    600: "IBMPlexSansArabic_600SemiBold",
    700: "IBMPlexSansArabic_700Bold",
  },
};

const buildPaperFonts = (lang) => {
  const faces = lang === "ar" ? FACES.ar : FACES.he;
  const base = configureFonts({ config: {} });
  const config = Object.fromEntries(
    Object.entries(base).map(([variant, props]) => {
      const weight = String(props.fontWeight ?? "400");
      return [
        variant,
        {
          fontFamily: faces[weight] || faces[400],
          fontWeight: "normal",
        },
      ];
    }),
  );
  return configureFonts({ config });
};

const paperFontsByLang = {
  he: buildPaperFonts("he"),
  ar: buildPaperFonts("ar"),
};
const paperFonts = paperFontsByLang.he;

const lightTheme = {
  ...MD3LightTheme,
  fonts: paperFonts,
  roundness: 11,
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
  fonts: paperFonts,
  roundness: 11,
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
  const {
    user,
    isLoadingUser,
    profile,
    backendError,
    profileError,
    retry,
    signOut,
  } = useAuth();
  const segments = useSegments();

  // Backend unreachable and we don't know who this is → don't route
  // anywhere (routing to onboarding is what made a paused project look
  // like a deleted account). Signed in, no profile in memory, and the
  // profile query failed → same hold, because routing to setupPrefs would
  // create a duplicate prefs doc. A failed *refresh* of an already-loaded
  // profile (settings modals call fetchUserProfile after saving) must NOT
  // tear down the app — hence the `!profile` guard.
  const showOutage =
    !isLoadingUser &&
    ((!user && !!backendError) || (!!user && !!profileError && !profile));

  useEffect(() => {
    if (isLoadingUser || showOutage) return;

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
  }, [user, segments, isLoadingUser, profile, showOutage]);

  if (isLoadingUser) {
    return <LoadingSpinner />;
  }

  if (showOutage) {
    return (
      <ServiceUnavailable
        kind={backendError || profileError || "server"}
        onRetry={retry}
        onSignOut={user ? signOut : undefined}
      />
    );
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
  const { scheme, loaded: themeLoaded } = useThemeMode();
  const { isRTL, lang, loading: langLoading } = useLanguage();
  const isDark = scheme === "dark";
  const base = isDark ? darkTheme : lightTheme;
  // Arabic swaps the whole Paper typescale onto the Arabic face. Memoised
  // so a re-render does not hand PaperProvider a fresh object every time.
  const theme = useMemo(
    () =>
      lang === "ar" ? { ...base, fonts: paperFontsByLang.ar } : base,
    [base, lang],
  );
  // Hold the first paint until the saved language and colour scheme are
  // read from storage (a few ms). Rendering before that flashed English
  // and the system theme on every cold start for users who chose
  // otherwise.
  if (!themeLoaded || langLoading) {
    return (
      <PaperProvider theme={theme}>
        <LoadingSpinner />
      </PaperProvider>
    );
  }
  return (
    // One place sets the layout direction for the entire app. Yoga
    // propagates it down every subtree, including react-native-paper's
    // portals, so rows, grids and logical insets mirror themselves in
    // Hebrew and Arabic. This replaced 52 hand-written row-reverse flips.
    //
    // Deliberately NOT I18nManager.forceRTL: that is a native, app-restart
    // switch that can leave a launch half-flipped. This is per-subtree and
    // takes effect on the next render.
    //
    // `direction` is typed @platform ios in React Native's own Flow types.
    // It works on Android only because app.json sets newArchEnabled — Fabric
    // parses it in C++ (YogaStylableProps), while the old architecture's
    // LayoutShadowNode.java has no `direction` prop at all. If the app ever
    // falls back to the old architecture, Android RTL disappears silently.
    <View style={{ flex: 1, direction: isRTL ? "rtl" : "ltr" }}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style={isDark ? "light" : "dark"} />
          <RouteGuard>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <ErrorBoundary>
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
                <UpdateBanner />
              </ErrorBoundary>
            </GestureHandlerRootView>
          </RouteGuard>
        </SafeAreaProvider>
      </PaperProvider>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexSansHebrew_400Regular,
    IBMPlexSansHebrew_500Medium,
    IBMPlexSansHebrew_600SemiBold,
    IBMPlexSansHebrew_700Bold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  if (!fontsLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ShiftsProvider>
            <ThemedApp />
          </ShiftsProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
