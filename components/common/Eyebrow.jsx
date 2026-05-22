import { useTheme } from "react-native-paper";
import Type from "./Type";

export default function Eyebrow({ children, color, style, variant = "eyebrow" }) {
  const theme = useTheme();
  return (
    <Type
      variant={variant}
      color={color || theme.colors.muted}
      style={style}
    >
      {children}
    </Type>
  );
}
