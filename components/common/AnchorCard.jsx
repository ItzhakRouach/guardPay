import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { withAlpha } from "../../lib/theme";

// Dark anchor card with a soft diagonal accent wash — same direction
// as HeroCard so light and dark surfaces share the same warm look.
//
// Slightly higher alpha than HeroCard so the gold registers against the
// deep navy anchor.
export default function AnchorCard({ children, radius = 18, style }) {
  const theme = useTheme();
  const wash = withAlpha(theme.colors.accent, 0.3);
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
