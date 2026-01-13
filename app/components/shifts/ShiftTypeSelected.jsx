import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { SegmentedButtons, useTheme } from "react-native-paper";
import { useLanguage } from "../../../lib/lang-context";

export default function ShiftTypeSelected({ value, handleShiftTypeChange }) {
  const theme = useTheme();
  const styles = makeStyle(theme);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  return (
    <>
      <SegmentedButtons
        density="regular"
        value={value}
        style={styles.segmented}
        onValueChange={handleShiftTypeChange}
        theme={{
          colors: {
            // Background of the SELECTED button
            secondaryContainer: theme.colors.secondaryContainer,

            // Text/Icon color of the SELECTED button
            onSecondaryContainer: theme.colors.primary,

            // Background of UNSELECTED buttons
            surface: theme.colors.surface,

            // Border color
            outline: theme.colors.borderOutline,
          },
        }}
        buttons={
          isRTL
            ? [
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
              ].reverse()
            : [
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
              ]
        }
      />
      <SegmentedButtons
        value={value}
        style={styles.segmentedTwo}
        onValueChange={handleShiftTypeChange}
        theme={{
          colors: {
            // Background of the SELECTED button
            secondaryContainer: theme.colors.secondaryContainer,

            // Text/Icon color of the SELECTED button
            onSecondaryContainer: theme.colors.primary,

            // Background of UNSELECTED buttons
            surface: theme.colors.surface,

            // Border color
            outline: theme.colors.borderOutline,
          },
        }}
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
    </>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    labelStyle: {
      color: theme.colors.primary,
      fontSize: 16,
    },
    segmented: {
      backgroundColor: theme.colors.surface,
      borderRadius: 30,
      marginHorizontal: 0,
    },
    segmentedTwo: {
      backgroundColor: theme.colors.surface,
      borderRadius: 30,
      marginHorizontal: 0,
      marginTop: 12,
    },
  });
