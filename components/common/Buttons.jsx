import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import Icon from "./Icon";
import Type from "./Type";

const baseRow = (gap) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap,
});

export function PrimaryButton({
  label,
  icon,
  onPress,
  disabled,
  fullWidth = true,
  size = "lg",
  style,
}) {
  const theme = useTheme();
  const pad = size === "lg" ? 20 : 14;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: theme.colors.cta,
          borderRadius: 16,
          paddingVertical: pad,
          paddingHorizontal: 24,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
        style,
      ]}
    >
      <View style={baseRow(10)}>
        {icon ? <Icon name={icon} size={20} color={theme.colors.ctaInk} /> : null}
        <Type variant="button" color={theme.colors.ctaInk}>
          {label}
        </Type>
      </View>
    </Pressable>
  );
}

export function OutlinedButton({
  label,
  icon,
  onPress,
  disabled,
  fullWidth = true,
  tone = "ink",
  style,
}) {
  const theme = useTheme();
  const color = tone === "neg" ? theme.colors.neg : theme.colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: 16,
          paddingHorizontal: 20,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
        style,
      ]}
    >
      <View style={baseRow(10)}>
        {icon ? <Icon name={icon} size={18} color={color} /> : null}
        <Type variant="button" color={color}>
          {label}
        </Type>
      </View>
    </Pressable>
  );
}

export function GhostButton({ label, icon, onPress, color, style }) {
  const theme = useTheme();
  const c = color || theme.colors.ink;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }, style]}
    >
      <View style={baseRow(6)}>
        {icon ? <Icon name={icon} size={18} color={c} /> : null}
        {label ? (
          <Type variant="button" color={c}>
            {label}
          </Type>
        ) : null}
      </View>
    </Pressable>
  );
}

export function IconBtn({ name, onPress, color, size = 22, style }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        {
          width: 38,
          height: 38,
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "center",
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Icon name={name} size={size} color={color || theme.colors.ink} />
    </Pressable>
  );
}
