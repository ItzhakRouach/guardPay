import { StyleSheet, View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";
import { withAlpha } from "../../lib/theme";

// Two modes:
//   default — fills its parent with the app background (root-level gates:
//             fonts, language/theme, auth bootstrap).
//   overlay — absolutely covers the parent with a translucent scrim and a
//             centred spinner. For in-flow saves (modals, Add Shift) where
//             a full-flex block with a solid background rendered as an odd
//             coloured slab under the form.
export default function LoadingSpinner({ overlay = false }) {
  const theme = useTheme();
  if (overlay) {
    return (
      <View
        pointerEvents="auto"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: withAlpha(
              theme.colors.bg,
              theme.dark ? 0.72 : 0.7,
            ),
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          animating
        />
      </View>
    );
  }
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
      }}
    >
      <ActivityIndicator size={70} color={theme.colors.primary} animating />
    </View>
  );
}
