import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

// Dark monthly banner used on Shifts + the net-pay card on the Paycheck
// modal. Accent gradient strip on the inline-end edge.
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
        colors={[theme.colors.accent + "55", "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.55, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: 110,
        }}
        pointerEvents="none"
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: 4,
          backgroundColor: theme.colors.accent,
          opacity: 0.9,
        }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
