import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { withAlpha } from "../../lib/theme";

// Surface card with a soft diagonal accent wash. Gradient starts at the
// top-trailing corner and runs down toward the bottom — like a sunbeam
// catching the right edge of the card.
export default function HeroCard({ children, radius = 24, style }) {
  const theme = useTheme();
  const wash = withAlpha(theme.colors.accent, 0.2);
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
        colors={[wash, transparent]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          left: 0,
        }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
