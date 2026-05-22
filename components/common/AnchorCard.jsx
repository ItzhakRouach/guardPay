import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { withAlpha } from "../../lib/theme";

// Dark anchor card. Soft accent glow in the top-end corner — same
// treatment as HeroCard so the gold blends in.
//
// Uses withAlpha() to construct gradient stops as rgba(...) instead of
// hex-with-alpha; the latter (`#RRGGBB + "33"` → 8-char hex) is
// unreliable on older Android RN.
export default function AnchorCard({ children, radius = 18, style }) {
  const theme = useTheme();
  const glow = withAlpha(theme.colors.accent, 0.33);
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
        colors={[glow, transparent]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.35, y: 0.7 }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 200,
          height: 180,
        }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
