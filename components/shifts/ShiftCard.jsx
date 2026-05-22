import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Card, IconButton, Text, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { resolveTint } from "../../lib/shiftColors";
import { formattedAmount } from "../../lib/utils";

export default function ShiftCard({
  dateTime,
  dateHours,
  totalAmout,
  // Optional: when passed, enables type-based background tint and the
  // note-present indicator. Callers that don't pass these get the legacy
  // un-tinted card.
  shift,
  userColors,
}) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const styles = makeStyle(theme, isRTL);
  const { t } = useTranslation();

  const tint = shift ? resolveTint(shift, userColors) : null;
  const hasNote = !!(shift?.comment && shift.comment.trim().length > 0);

  return (
    <Card
      style={[
        styles.cardShift,
        tint ? { backgroundColor: tint } : null,
      ]}
      elevation={1}
    >
      <Card.Content>
        <View style={styles.cardDetails}>
          <View style={styles.shiftAmount}>
            <Text variant="labelLarge" style={styles.darkTextBold}>
              {t("shifts.amount")}
            </Text>
            <Text variant="headlineSmall" style={styles.darkText}>
              {formattedAmount(totalAmout)}₪
            </Text>
          </View>
          <View style={styles.shiftDate}>
            <Text variant="labelLarge" style={styles.darkText}>
              {dateTime}
            </Text>
            <Text variant="labelMedium" style={styles.darkText}>
              {dateHours}
            </Text>
          </View>
        </View>
        {hasNote && (
          <View
            style={[
              styles.noteIndicator,
              isRTL ? { left: 4 } : { right: 4 },
            ]}
            pointerEvents="none"
          >
            <IconButton
              icon="note-text-outline"
              size={18}
              iconColor={theme.colors.primary}
              style={styles.noteIcon}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    cardDetails: {
      flexDirection: "row",
      justifyContent: "space-around",
      textAlign: "left",
    },
    cardShift: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginBottom: 10,
      marginHorizontal: 3,
      marginVertical: 3,
    },
    shiftAmount: {
      justifyContent: "center",
      alignItems: "center",
      color: theme.colors.primary,
    },
    shiftDate: {
      textAlign: "center",
      justifyContent: "center",
      alignItems: "center",
      gap: 5,
    },
    darkTextBold: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    noteIndicator: {
      position: "absolute",
      top: 0,
    },
    noteIcon: {
      margin: 0,
    },
  });
