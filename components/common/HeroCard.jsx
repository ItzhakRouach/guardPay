import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

// Surface card with a faked radial gradient in the top-end corner.
// RN has no native radial gradient — we stack two diagonal linear gradients
// to approximate the warm glow specified in the design.
export default function HeroCard({ children, radius = 24, style }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[theme.colors.accent + "38", "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.4, y: 0.65 }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 220,
          height: 200,
        }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[theme.colors.accent + "20", "transparent"]}
        start={{ x: 0.95, y: 0.05 }}
        end={{ x: 0.55, y: 0.45 }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 160,
          height: 140,
        }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
