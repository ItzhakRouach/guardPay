import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { withAlpha } from "../../lib/theme";

// Surface card with a soft accent glow in the top-end corner.
// One gradient is enough — two layers were too punchy.
export default function HeroCard({ children, radius = 24, style }) {
  const theme = useTheme();
  const glow = withAlpha(theme.colors.accent, 0.22);
  const transparent = withAlpha(theme.colors.accent, 0);
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
        colors={[glow, transparent]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.35, y: 0.7 }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 180,
          height: 160,
        }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
