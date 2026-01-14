import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";

export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: "rgba(33, 52, 72, 1)",
        headerStyle: { backgroundColor: theme.colors.background },
        headerTitle: "",
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="onBoarding" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: true }} />
      <Stack.Screen name="signIn" options={{ headerShown: true }} />
      <Stack.Screen name="setupPrefs" options={{ headerShown: false }} />
    </Stack>
  );
}
