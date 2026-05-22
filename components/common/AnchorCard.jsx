import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

// Dark anchor card — used for the net-pay block on the Paycheck modal
// where the deep navy is the focal point of the document.
//
// The gold glow is intentionally large and low-alpha so it eases into
// the navy rather than reading as a patched-on stripe. Two stacked
// gradients of decreasing opacity smooth the falloff.
export default function AnchorCard({ children, radius = 18, style }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: theme.colors.anchor,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[theme.colors.accent + "30", "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.1, y: 0.9 }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 280,
          height: 220,
        }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[theme.colors.accent + "18", "transparent"]}
        start={{ x: 1, y: 0.05 }}
        end={{ x: 0.3, y: 0.55 }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 180,
          height: 140,
        }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
