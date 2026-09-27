import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { SegmentedButtons, useTheme } from "react-native-paper";
import { radius } from "../../lib/theme";

export default function ShiftTypeSelected({ value, handleShiftTypeChange }) {
  const theme = useTheme();
  const styles = makeStyle(theme);
  const { t } = useTranslation();
  return (
    <>
      <SegmentedButtons
        density="regular"
        value={value}
        style={styles.segmented}
        onValueChange={handleShiftTypeChange}
        theme={segmentedTheme(theme)}
        buttons={[
          {
            uncheckedColor: theme.colors.onSecondaryContainer,
            value: "morning",
            label: t("shift_type.morning"),
            labelStyle: styles.labelStyle,
            icon: "weather-sunset-up",
            showSelectedCheck: false,
          },
          {
            uncheckedColor: theme.colors.onSecondaryContainer,
            value: "evening",
            label: t("shift_type.evening"),
            labelStyle: styles.labelStyle,
            icon: "weather-sunset-down",
            showSelectedCheck: false,
          },
          {
            uncheckedColor: theme.colors.onSecondaryContainer,
            value: "night",
            label: t("shift_type.night"),
            labelStyle: styles.labelStyle,
            icon: "weather-night",
            showSelectedCheck: false,
          },
        ]}
      />
      <SegmentedButtons
        value={value}
        style={styles.segmentedTwo}
        onValueChange={handleShiftTypeChange}
        theme={segmentedTheme(theme)}
        buttons={[
          {
            uncheckedColor: theme.colors.onSecondaryContainer,
            value: "training",
            label: t("shift_type.training"),
            labelStyle: styles.labelStyle,
            icon: "karate",
            showSelectedCheck: false,
          },
          {
            uncheckedColor: theme.colors.onSecondaryContainer,
            value: "vacation",
            label: t("shift_type.vacation"),
            labelStyle: styles.labelStyle,
            icon: "home-heart",
            showSelectedCheck: false,
          },
        ]}
      />
      <SegmentedButtons
        value={value}
        style={styles.segmentedTwo}
        onValueChange={handleShiftTypeChange}
        theme={segmentedTheme(theme)}
        buttons={[
          {
            uncheckedColor: theme.colors.onSecondaryContainer,
            value: "sick",
            label: t("shift_type.sick"),
            labelStyle: styles.labelStyle,
            icon: "emoticon-sick-outline",
            showSelectedCheck: false,
          },
          {
            uncheckedColor: theme.colors.onSecondaryContainer,
            value: "holiday",
            label: t("shift_type.holiday"),
            labelStyle: styles.labelStyle,
            icon: "calendar-star",
            showSelectedCheck: false,
          },
        ]}
      />
    </>
  );
}

// Paper computes a segmented item's corner as `5 * roundness`. The app sets
// roundness to 11 so that TextInput lands on the control radius, which here
// would give 55 and clamp every button into a full pill. Dividing it back out
// is the only lever SegmentedButtons exposes.
const segmentedTheme = (theme) => ({
  roundness: radius.control / 5,
  colors: {
    // Background of the SELECTED button
    secondaryContainer: theme.colors.secondaryContainer,
    // Text and icon colour of the SELECTED button
    onSecondaryContainer: theme.colors.primary,
    // Background of UNSELECTED buttons
    surface: theme.colors.surface,
    // Border colour
    outline: theme.colors.borderOutline,
  },
});

const makeStyle = (theme) =>
  StyleSheet.create({
    labelStyle: {
      color: theme.colors.primary,
      fontSize: 15,
    },
    // No background and no radius of its own. The row used to paint a
    // surface-coloured pill at radius 30 behind buttons whose own corners
    // are radius.control, so the mismatched box showed through as a visible
    // container. The buttons draw their own outline and fill; the row is
    // only a layout box.
    segmented: {
      marginHorizontal: 0,
    },
    segmentedTwo: {
      marginHorizontal: 0,
      marginTop: 12,
    },
  });
