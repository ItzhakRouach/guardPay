import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
      <Stack.Screen name="onBoarding" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Register" }} />
      <Stack.Screen name="signIn" options={{ title: "Sign In" }} />
      <Stack.Screen
        name="setupPrefs"
        options={{ title: "Setup Profile", headerShown: false }}
      />
    </Stack>
  );
}
