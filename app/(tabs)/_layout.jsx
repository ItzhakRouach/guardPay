import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { useTheme } from "react-native-paper"; // Added for icon colors

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.dark;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Since the bar is WHITE, icons must be DARK NAVY to pop
        tabBarActiveTintColor: isDark ? theme.colors.primary : "#213448",
        tabBarInactiveTintColor: "rgba(15, 23, 42, 0.4)",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginBottom: 8,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "6",
        },
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shifts"
        options={{
          title: t("tabs.shifts"),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="calendar-plus"
              size={30}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="overview"
        options={{
          title: t("tabs.overview"),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="calendar-month"
              size={30}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    alignItems: "center",
    bottom: 20,
    marginHorizontal: 75,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ffffff",
    elevation: 0,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
});
