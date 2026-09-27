import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { radius } from "../../lib/theme";

// The dark card that carries net pay. Flat, like the rest of the redesign;
// the accent wash is gone for the same reason it left HeroCard.
export default function AnchorCard({
  children,
  radius: r = radius.sheet,
  style,
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: r,
          backgroundColor: theme.colors.anchor,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
