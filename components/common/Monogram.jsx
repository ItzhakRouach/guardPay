import { View } from "react-native";
import { useTheme } from "react-native-paper";
import Type from "./Type";

export default function Monogram({ size = 64, letter = "G" }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 5,
        backgroundColor: theme.colors.ink,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Type
        variant="h1"
        color={theme.colors.bg}
        style={{
          fontSize: size * 0.56,
          letterSpacing: -1,
          lineHeight: size * 0.6,
        }}
      >
        {letter}
      </Type>
    </View>
  );
}
