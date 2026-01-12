import { StyleSheet } from "react-native";
import { SegmentedButtons, useTheme } from "react-native-paper";

export default function ShiftTypeSelected({ value, handleShiftTypeChange }) {
  const theme = useTheme();
  const styles = makeStyle(theme);
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
        buttons={[
          {
            uncheckedColor: theme.colors.onSecondaryContainer,
            value: "morning",
            label: "Morning",
            labelStyle: styles.labelStyle,
            icon: "weather-sunset-up",
            showSelectedCheck: false,
          },
          {
            uncheckedColor: theme.colors.onSecondaryContainer,
            value: "evening",
            label: "Evening",
            labelStyle: styles.labelStyle,
            icon: "weather-sunset-down",
            showSelectedCheck: false,
          },
          {
            uncheckedColor: theme.colors.onSecondaryContainer,
            value: "night",
            label: "Night",
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
            label: "Training",
            labelStyle: styles.labelStyle,
            icon: "karate",
            showSelectedCheck: false,
          },
          {
            uncheckedColor: theme.colors.onSecondaryContainer,
            value: "vacation",
            label: "Vacation",
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
