import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { IconButton, Surface, Text, useTheme } from "react-native-paper";
export default function MonthPicker({ currentDate, setCurrentDate }) {
  const theme = useTheme();
  const styles = makeStyle(theme);
  const { t } = useTranslation();

  // Logic to change months
  const changeMonth = (offset) => {
    const newDate = new Date(
      currentDate.setMonth(currentDate.getMonth() + offset),
    );
    setCurrentDate(new Date(newDate));
  };

  const monthName = t(`month.${currentDate.getMonth()}`);
  const yearName = currentDate.getFullYear();

  return (
    <Surface style={styles.header}>
      <IconButton icon="chevron-left" onPress={() => changeMonth(-1)} />
      <View style={styles.dateInfo}>
        <Text variant="titleLarge" style={styles.monthText}>
          {monthName}
        </Text>
        <Text variant="bodySmall">{yearName}</Text>
      </View>
      <IconButton icon="chevron-right" onPress={() => changeMonth(+1)} />
    </Surface>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 20,
      paddingBottom: 10,
      backgroundColor: theme.colors.surface,
      marginTop: 60,
      borderRadius: 20,
    },
    dateInfo: {
      alignItems: "center",
    },
    monthText: { fontWeight: "bold", color: theme.colors.primary },
  });
