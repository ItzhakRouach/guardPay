import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { withAlpha } from "../../lib/theme";

// Surface card with a soft accent glow in the top-end corner.
//
// The gradient is intentionally oversized — it overflows the card on
// the top + right and the clip-on-overflow keeps the visible falloff
// in the interior. With a smaller bounding box, the gradient's stop
// landed on a visible edge inside the card and read as a hard line;
// by extending it past the corner we move that edge off-screen so
// only the smooth interior of the falloff remains visible.
//
// `mid` is a half-alpha stop so the glow eases out smoothly rather
// than dropping linearly to transparent — the linear interpolation
// over-emphasises the mid-tones and makes the edge noticeable.
export default function HeroCard({ children, radius = 24, style }) {
  const theme = useTheme();
  const glow = withAlpha(theme.colors.accent, 0.2);
  const mid = withAlpha(theme.colors.accent, 0.05);
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
        colors={[glow, mid, transparent]}
        locations={[0, 0.55, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.05, y: 1 }}
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 320,
          height: 280,
        }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
