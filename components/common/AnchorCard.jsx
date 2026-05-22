import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

// Dark monthly banner. Subtle accent gradient on the inline-end edge
// — kept narrow and contained so it doesn't crowd the right column.
// `overflow: hidden` clips both the gradient and the 3px accent rule
// to the rounded radius so the gold doesn't bleed past the corner.
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
        end={{ x: 0.7, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: 60,
        }}
        pointerEvents="none"
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: 3,
          backgroundColor: theme.colors.accent,
          opacity: 0.85,
        }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
