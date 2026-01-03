import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

function GlassTabBarBg() {
  return (
    <View style={styles.bgWrap} pointerEvents="none">
      {/* Strong blur base */}
      <BlurView intensity={95} tint="light" style={styles.blurBase} />

      {/* Slight tint + saturation feel */}
      <View style={styles.tintLayer} />

      {/* Top inner highlight (Apple-ish) */}
      <LinearGradient
        colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0.05)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.innerHighlight}
      />

      {/* Edge shine */}
      <View style={styles.edgeShine} />

      {/* Subtle bottom shadow fade inside */}
      <LinearGradient
        colors={["rgba(0,0,0,0.00)", "rgba(0,0,0,0.10)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.innerShade}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#213448",
        tabBarInactiveTintColor: "rgba(33,52,72,0.4)",
        tabBarLabelStyle: { fontSize: 12, fontWeight: 500 },
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
            <MaterialCommunityIcons name="cog" size={24} color={color} />
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
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// defined the style needed for the glass-like tabs view
const styles = StyleSheet.create({
  glassTabBar: {
    position: "absolute",
    bottom: 24,
    marginHorizontal: 28,
    height: 65,
    borderRadius: 30,
    borderTopWidth: 1,
    backgroundColor: "transparent",
    elevation: 0,
    // iOS shadow (important for “floating” liquid)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    flex: 1,
  },

  bgWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    overflow: "hidden",
  },

  blurBase: {
    ...StyleSheet.absoluteFillObject,
  },

  // Soft white tint that makes it “milky glass”
  tintLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },

  // Thin bright border-like shine
  edgeShine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },

  innerShade: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
});
