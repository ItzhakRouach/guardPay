import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { formattedAmount } from "../../lib/utils";

export default function MonthNetoCard({ neto }) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);
  return (
    <Card style={styles.netoContainer}>
      <Card.Content style={styles.cardStyle}>
        <View>
          <Text variant="titleMedium" style={styles.netoField}>
            {t("overview.neto")}
          </Text>
        </View>
        <View>
          <Text variant="titleLarge" style={styles.income}>
            {formattedAmount(neto)} ₪
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    netoContainer: {
      marginTop: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 15,
      marginHorizontal: 10,
      elevation: 4,
    },
    cardStyle: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingVertical: 15,
    },
    income: {
      fontWeight: "bold",
      color: "#10B981",
    },
    netoField: {
      fontWeight: "bold",
      color: theme.colors.primary,
      writingDirection: isRTL ? "rtl" : "ltr",
    },
  });
