import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { Card, Divider, IconButton, Text, useTheme } from "react-native-paper";
import { useLanguage } from "../hooks/lang-context";
import { formatShiftDate, formatShiftTime } from "../lib/utils";

export default function ShiftDetails() {
  const { shiftData } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const shift = shiftData ? JSON.parse(shiftData) : null;
  const styles = makeStyle(theme, isRTL);

  if (!shift) return null;

  const DetailRow = ({ label, value, suffix = "" }) => {
    if (!value || value === 0 || value === "0") return null;
    return (
      <View style={styles.detailRow}>
        <Text variant="bodyLarge" style={styles.label}>
          {label}
        </Text>
        <Text variant="bodyLarge" style={styles.value}>
          {value}
          {suffix}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header עם ניווט חזרה למסך המשמרות */}
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon={isRTL ? "arrow-right" : "arrow-left"}
            size={28}
            onPress={() => router.back()}
          />
          <Text variant="labelLarge" style={styles.backText}>
            {t("shiftDetails.back")}
          </Text>
        </View>
        <Text variant="titleMedium" style={styles.headerTitle}>
          {t("shiftDetails.title")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Card.Content>
            {/* מידע כללי על המשמרת */}
            <View style={styles.timeSection}>
              <Text variant="headlineSmall" style={styles.dateText}>
                {formatShiftDate(shift.start_time)}
              </Text>
              <Text variant="titleMedium" style={styles.timeRange}>
                {formatShiftTime(shift.start_time)} -{" "}
                {formatShiftTime(shift.end_time)}
              </Text>
              <View style={styles.rateBadge}>
                <Text style={styles.rateText}>
                  {t("shiftDetails.baseRate")}: ₪{shift.base_rate}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <Text variant="labelMedium" style={styles.sectionLabel}>
              {t("shiftDetails.sectionHours")}
            </Text>

            {/* פירוט כל סוגי השעות הנוספות */}
            <DetailRow
              label={t("shiftDetails.regHours")}
              value={shift.h100_hours}
              suffix=" h"
            />
            <DetailRow
              label={t("shiftDetails.h125")}
              value={shift.h125_extra_hours}
              suffix=" h"
            />
            <DetailRow
              label={t("shiftDetails.h150")}
              value={shift.h150_extra_hours}
              suffix=" h"
            />
            <DetailRow
              label={t("shiftDetails.h150Shabat")}
              value={shift.h150_shabat}
              suffix=" h"
            />
            <DetailRow
              label={t("shiftDetails.h175")}
              value={shift.h175_extra_hours}
              suffix=" h"
            />
            <DetailRow
              label={t("shiftDetails.h200")}
              value={shift.h200_extra_hours}
              suffix=" h"
            />
            {/* שורות חג חדשות */}
            <DetailRow
              label={t("shiftDetails.h150Holiday") || "150% חג"}
              value={shift.h150_holiday}
              suffix=" h"
            />
            <DetailRow
              label={t("shiftDetails.h175Holiday") || "175% חג"}
              value={shift.h175_holiday}
              suffix=" h"
            />
            <DetailRow
              label={t("shiftDetails.h200Holiday") || "200% חג"}
              value={shift.h200_holiday}
              suffix=" h"
            />

            <Divider style={styles.divider} />

            {/* פירוט כספי */}
            <DetailRow
              label={t("shiftDetails.basePay")}
              value={shift.reg_pay_amount}
              suffix=" ₪"
            />
            <DetailRow
              label={t("shiftDetails.extraPay")}
              value={shift.extra_pay_amount}
              suffix=" ₪"
            />
            <DetailRow
              label={t("shiftDetails.travel")}
              value={shift.travel_pay_amount}
              suffix=" ₪"
            />

            {shift.is_training && (
              <View style={styles.trainingBadge}>
                <Text style={styles.trainingText}>
                  {t("shiftDetails.training")}
                </Text>
              </View>
            )}

            {/* שורה תחתונה - סה"כ ברוטו */}
            <View style={styles.totalContainer}>
              <Text variant="headlineSmall" style={styles.totalLabel}>
                {t("shiftDetails.totalBruto")}
              </Text>
              <Text variant="headlineSmall" style={styles.totalValue}>
                ₪{shift.total_amount}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    headerLeft: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
    },
    backText: {
      color: theme.colors.primary,
      fontWeight: "bold",
      fontSize: 16,
    },
    headerTitle: {
      fontWeight: "bold",
      color: theme.colors.onSurface,
    },
    scrollContent: { padding: 16, paddingBottom: 40 },
    card: {
      borderRadius: 24,
      elevation: 0,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    timeSection: { alignItems: "center", marginBottom: 5 },
    dateText: { fontWeight: "bold", color: theme.colors.primary },
    timeRange: { color: theme.colors.dateText, marginTop: 4 },
    rateBadge: {
      backgroundColor: theme.colors.secondaryContainer,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 12,
      marginTop: 12,
    },
    rateText: {
      fontSize: 14,
      fontWeight: "bold",
      color: theme.colors.onSecondaryContainer,
    },
    divider: {
      marginVertical: 20,
      backgroundColor: theme.colors.outlineVariant,
      height: 1,
    },
    sectionLabel: {
      color: theme.colors.summary,
      marginBottom: 15,
      textAlign: isRTL ? "right" : "left",
      textTransform: "uppercase",
      fontSize: 12,
      letterSpacing: 1.2,
    },
    detailRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginVertical: 10,
    },
    label: { color: theme.colors.onSurface, opacity: 0.7 },
    value: { fontWeight: "bold", color: theme.colors.onSurface },
    totalContainer: {
      marginTop: 25,
      paddingTop: 20,
      borderTopWidth: 2,
      borderTopColor: theme.colors.outlineVariant,
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    totalLabel: { fontWeight: "bold", color: theme.colors.primary },
    totalValue: {
      fontWeight: "bold",
      color: theme.colors.primary,
      fontSize: 26,
    },
    trainingBadge: {
      backgroundColor: theme.colors.error + "20",
      padding: 12,
      borderRadius: 12,
      marginTop: 15,
      alignItems: "center",
    },
    trainingText: { color: theme.colors.error, fontWeight: "bold" },
  });
