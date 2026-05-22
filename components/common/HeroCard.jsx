import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

// Surface card with a soft accent glow in the top-end corner.
// One subtle linear gradient does the job — two stacked layers were
// too punchy. `overflow: hidden` keeps the glow inside the rounded corner.
export default function HeroCard({ children, radius = 24, style }) {
  const theme = useTheme();
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
        colors={[theme.colors.accent + "22", "transparent"]}
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
