import { View } from "react-native";
import { useTheme } from "react-native-paper";

export default function Hairline({
  vertical = false,
  thickness = 1,
  color,
  style,
  soft = false,
}) {
  const theme = useTheme();
  const c = color || (soft ? theme.colors.borderSoft : theme.colors.border);
  return (
    <View
      style={[
        vertical
          ? { width: thickness, alignSelf: "stretch", backgroundColor: c }
          : { height: thickness, alignSelf: "stretch", backgroundColor: c },
        style,
      ]}
    />
  );
}
