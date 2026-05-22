import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

// Dark monthly banner. Soft accent glow in the top-end corner — same
// treatment as HeroCard so the gold blends in instead of cutting a
// hard line at the edge.
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
        colors={[theme.colors.accent + "33", "transparent"]}
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
