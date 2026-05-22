import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import Type from "./Type";

// Segmented pill (e.g. EN / HE). Pure visual — call sites manage state.
export default function Pill({ options, value, onChange }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        padding: 2,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange?.(opt.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 11,
              backgroundColor: active ? theme.colors.accentSoft : "transparent",
            }}
          >
            <Type
              variant="eyebrow"
              color={active ? theme.colors.accent : theme.colors.muted}
              style={{ letterSpacing: 1.2 }}
            >
              {opt.label}
            </Type>
          </Pressable>
        );
      })}
    </View>
  );
}
