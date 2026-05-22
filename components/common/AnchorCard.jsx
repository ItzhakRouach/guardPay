import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { withAlpha } from "../../lib/theme";

// Dark anchor card — used for the net-pay block on the Paycheck modal.
//
// Same blend strategy as HeroCard: oversize the gradient layer so its
// falloff edge lives outside the card's visible area, and use a
// three-stop curve (full glow → faint mid → transparent) so the
// transition is perceptually smooth instead of hard-linear.
//
// Slightly higher base alpha than HeroCard because the gold has to
// register against the deep navy anchor; the mid stop keeps it from
// looking like a band.
export default function AnchorCard({ children, radius = 18, style }) {
  const theme = useTheme();
  const glow = withAlpha(theme.colors.accent, 0.34);
  const mid = withAlpha(theme.colors.accent, 0.08);
  const transparent = withAlpha(theme.colors.accent, 0);
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
        colors={[glow, mid, transparent]}
        locations={[0, 0.55, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.05, y: 1 }}
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 340,
          height: 260,
        }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
