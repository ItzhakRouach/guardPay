import { Stack, useRouter } from "expo-router";

export default function AuthLayout() {
  const router = useRouter();
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: "rgba(33, 52, 72, 1)",
        headerStyle: { backgroundColor: "#F8FAFC" },
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
