import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { radius } from "../../lib/theme";

// A plain surface card. The diagonal accent wash it used to carry was
// decoration that competed with the figure inside it, and a gradient on a
// card is the commonest tell of a generated interface.
export default function HeroCard({ children, radius: r = radius.card, style }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: r,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
