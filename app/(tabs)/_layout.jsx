import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useTheme } from "react-native-paper"; // Added for icon colors


export default function TabsLayout() {
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
          paddingTop: "8",

        },
        tabBarStyle: styles.tabBar,
       
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shifts"
        options={{
          title: "Shifts",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="calendar-plus"
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
    position:"absolute",
    alignItems:"center",
    bottom: 26,
    marginHorizontal: 85,
    height: 60,
    left:60,
    right:60,
    borderRadius: 30,
    backgroundColor: "#ffffffff",
    elevation: 0,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
});
