import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Profile" }} />
      <Tabs.Screen name="shifts" options={{ title: "Shifts" }} />
    </Tabs>
  );
}
