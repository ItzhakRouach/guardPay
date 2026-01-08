import { StyleSheet, View } from "react-native";
import { Divider, Surface, Text, useTheme } from "react-native-paper";

export default function MonthSummary({
  bruto,
  totalShifts,
  totalRegHours,
  totalExtraHours,
  monthTravelMoney,
  monthRegPay,
  monthExtraPay,
  pensia,
  bituahLeumi,
  incomeTax,
  totalDeductions,
}) {
  const theme = useTheme();
  const styles = makeStyle(theme);
  return (
    <Surface elevation={1} style={styles.contentSurface}>
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          Bruto Income:
        </Text>
        <Text variant="bodyLarge" style={styles.income}>
          {bruto}
        </Text>
      </View>
      <Divider style={styles.dividerStyle} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          Shifts Worked:
        </Text>
        <Text variant="bodyLarge" style={styles.shiftsField}>
          {totalShifts}
        </Text>
      </View>
      <Divider style={styles.dividerStyle} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          Total Regular Hours:
        </Text>
        <Text variant="bodyLarge" style={styles.shiftsField}>
          {totalRegHours}
        </Text>
      </View>
      <Divider style={styles.dividerStyle} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          Total Extra Hours:
        </Text>
        <Text variant="bodyLarge" style={styles.shiftsField}>
          {totalExtraHours}
        </Text>
      </View>
      <Divider style={styles.dividerStyle} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          Travel Money:
        </Text>
        <Text variant="bodyLarge" style={styles.income}>
          {monthTravelMoney}
        </Text>
      </View>
      <Divider style={styles.dividerStyle} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          Regular Hours Money:
        </Text>
        <Text variant="bodyLarge" style={styles.income}>
          {monthRegPay}
        </Text>
      </View>
      <Divider style={styles.dividerStyle} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          Extra Hours Money:
        </Text>
        <Text variant="bodyLarge" style={styles.income}>
          {monthExtraPay}
        </Text>
      </View>
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          Bituah Leumi and Health:
        </Text>
        <Text variant="bodyLarge" style={styles.expense}>
          {bituahLeumi.toFixed(2)}
        </Text>
      </View>
      <Divider style={styles.dividerStyle} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          Pensia:
        </Text>
        <Text variant="bodyLarge" style={styles.expense}>
          {pensia.toFixed(2)}
        </Text>
      </View>
      <Divider style={styles.dividerStyle} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          Tax:
        </Text>
        <Text variant="bodyLarge" style={styles.expense}>
          {incomeTax.toFixed(2)}
        </Text>
      </View>
      <Divider style={styles.dividerStyle} />
      <View style={styles.salaryContent}>
        <Text variant="bodyLarge" style={styles.field}>
          Total Dedaction:
        </Text>
        <Text variant="bodyLarge" style={styles.expense}>
          {totalDeductions.toFixed(2)}
        </Text>
      </View>
      <Divider style={styles.dividerStyle} />
    </Surface>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    contentSurface: {
      marginTop: 20,
      padding: 10,
      marginHorizontal: 10,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
    },
    salaryContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 20,
      marginBottom: 10,
    },
    dividerStyle: {
      marginBottom: 10,
    },
    netoContainer: {
      marginTop: 40,
      backgroundColor: theme.colors.surface,
      padding: 10,
      marginHorizontal: 20,
    },
    cardStyle: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    field: {
      fontWeight: "600",
      marginLeft: 10,
      color: theme.colors.primary,
    },
    shiftsField: {
      fontWeight: "bold",
      marginRight: 10,
    },
    income: {
      fontWeight: "bold",
      color: "#466644",
      marginRight: 10,
    },
    expense: {
      fontWeight: "bold",
      color: "#963a34",
      marginRight: 10,
    },
  });
