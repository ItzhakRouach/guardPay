import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper"; // Added for icon colors

function GlassTabBarBg() {
  // We keep tint="light" even in dark mode so it stays white/milky
  return (
    <View style={styles.bgWrap} pointerEvents="none">
      <BlurView intensity={95} tint="light" style={styles.blurBase} />
      <View style={styles.tintLayer} />
      <LinearGradient
        colors={["rgba(255,255,255,0.7)", "rgba(255,255,255,0.2)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.innerHighlight}
      />
      <View style={styles.edgeShine} />
      <LinearGradient
        colors={["rgba(0,0,0,0.00)", "rgba(0,0,0,0.05)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.innerShade}
      />
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Since the bar is WHITE, icons must be DARK NAVY to pop
        tabBarActiveTintColor: "#0F172A",
        tabBarInactiveTintColor: "rgba(15, 23, 42, 0.4)",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarItemStyle: { justifyContent: "center", alignItems: "center" },
        tabBarStyle: styles.glassTabBar,
        tabBarBackground: () => <GlassTabBarBg />,
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
  glassTabBar: {
    position: "absolute",
    bottom: 24,
    marginHorizontal: 28,
    height: 65,
    borderRadius: 30,
    borderTopWidth: 0, // Removed border for a cleaner liquid look
    backgroundColor: "transparent",
    elevation: 0,
    // Stronger shadow so the white bar "floats" over the dark navy background
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  bgWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Added slight base color for pop
  },
  blurBase: {
    ...StyleSheet.absoluteFillObject,
  },
  tintLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
  },
  edgeShine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  innerShade: {
    ...StyleSheet.absoluteFillObject,
  },
});
