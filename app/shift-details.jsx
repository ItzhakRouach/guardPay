import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Divider,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
import ShiftNoteModal from "../components/shifts/ShiftNoteModal";
import { useLanguage } from "../hooks/lang-context";
import { buildShiftBreakdown } from "../lib/shiftBreakdown";
import { formatShiftDate, formatShiftTime } from "../lib/utils";

const money = (n) =>
  Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const hrs = (n) => {
  const v = Number(n || 0);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

export default function ShiftDetails() {
  const { shiftData } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const initialShift = shiftData ? JSON.parse(shiftData) : null;
  // Local copy so saving a note updates the view without round-tripping
  // through the realtime subscription.
  const [shift, setShift] = useState(initialShift);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const styles = makeStyle(theme, isRTL);

  if (!shift) return null;

  // All the numbers below come from the stored document via
  // buildShiftBreakdown — nothing is recomputed here, so this screen cannot
  // disagree with the month total or the payslip. Labels key off is_holiday
  // (an imported חג shift keeps its hours in the Shabbat fields).
  const b = buildShiftBreakdown(shift);
  const isWorked = b.kind === "worked";

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

  // One "hours × rate = amount" line per pay bracket.
  const BreakdownRow = ({ row }) => (
    <View style={styles.bRow}>
      <View style={styles.bLabelCell}>
        <Text variant="bodyMedium" style={styles.bLabel}>
          {t(row.labelKey)}
        </Text>
      </View>
      <Text variant="bodyMedium" style={[styles.bNum, styles.bHours]}>
        {hrs(row.hours)}
      </Text>
      <Text variant="bodyMedium" style={[styles.bNum, styles.bRate]}>
        {money(row.rate)}
      </Text>
      <Text variant="bodyMedium" style={[styles.bNum, styles.bAmount]}>
        {money(row.amount)}
      </Text>
    </View>
  );

  const SubtotalRow = ({ label, hours, amount }) => (
    <View style={[styles.bRow, styles.bSubtotal]}>
      <View style={styles.bLabelCell}>
        <Text variant="bodyMedium" style={styles.bSubtotalLabel}>
          {label}
        </Text>
      </View>
      <Text
        variant="bodyMedium"
        style={[styles.bNum, styles.bHours, styles.bSubtotalLabel]}
      >
        {hrs(hours)}
      </Text>
      <Text variant="bodyMedium" style={[styles.bNum, styles.bRate]} />
      <Text
        variant="bodyMedium"
        style={[styles.bNum, styles.bAmount, styles.bSubtotalLabel]}
      >
        {money(amount)}
      </Text>
    </View>
  );

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

            {/* Shift length + the rule that applied */}
            {isWorked ? (
              <>
                <DetailRow
                  label={t("shiftDetails.duration")}
                  value={hrs(b.durationHours)}
                  suffix={` ${t("shiftDetails.hoursUnit")}`}
                />
                <Text variant="bodySmall" style={styles.ruleText}>
                  {t(b.isNight ? "shiftDetails.night" : "shiftDetails.day")}
                </Text>
                {shift.weekly_regular_before !== undefined &&
                shift.weekly_regular_before !== null ? (
                  <Text variant="bodySmall" style={styles.ruleText}>
                    {t("shiftDetails.weekly_before", {
                      hours: hrs(shift.weekly_regular_before),
                    })}
                  </Text>
                ) : null}
              </>
            ) : null}

            {isWorked ? (
              <View style={styles.bTable}>
                <View style={[styles.bRow, styles.bHeader]}>
                  <View style={styles.bLabelCell} />
                  <Text
                    variant="labelSmall"
                    style={[styles.bNum, styles.bHours, styles.bHeaderText]}
                  >
                    {t("shiftDetails.colHours")}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={[styles.bNum, styles.bRate, styles.bHeaderText]}
                  >
                    {t("shiftDetails.colRate")}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={[styles.bNum, styles.bAmount, styles.bHeaderText]}
                  >
                    {t("shiftDetails.colAmount")}
                  </Text>
                </View>

                {b.hourRows
                  .filter((r) => r.regular)
                  .map((r) => (
                    <BreakdownRow key={r.key} row={r} />
                  ))}
                <SubtotalRow
                  label={t("shiftDetails.regularSubtotal")}
                  hours={b.regularHours}
                  amount={b.regularPay}
                />

                {b.overtimeHours > 0 ? (
                  <>
                    {b.hourRows
                      .filter((r) => !r.regular)
                      .map((r) => (
                        <BreakdownRow key={r.key} row={r} />
                      ))}
                    <SubtotalRow
                      label={t("shiftDetails.overtimeSubtotal")}
                      hours={b.overtimeHours}
                      amount={b.overtimePay}
                    />
                  </>
                ) : null}
              </View>
            ) : (
              <>
                <DetailRow
                  label={t(
                    b.kind === "sick"
                      ? "shiftDetails.sick"
                      : b.kind === "vacation"
                        ? "shiftDetails.vacation"
                        : "shiftDetails.training",
                  )}
                  value={t("shiftDetails.flatDay")}
                />
                {b.kind === "sick" ? (
                  <DetailRow
                    label={t("shiftDetails.sickPercent")}
                    value={`${Math.round((b.sickPercent || 0) * 100)}%`}
                  />
                ) : null}
              </>
            )}

            <Divider style={styles.divider} />

            <DetailRow
              label={t("shiftDetails.travel")}
              value={b.travelPay > 0 ? money(b.travelPay) : 0}
              suffix=" ₪"
            />

            {shift.is_training && (
              <View style={styles.trainingBadge}>
                <Text style={styles.trainingText}>
                  {t("shiftDetails.training")}
                </Text>
              </View>
            )}

            {/* Note section */}
            <Divider style={styles.divider} />
            <Text variant="labelMedium" style={styles.sectionLabel}>
              {t("shiftDetails.note_section")}
            </Text>
            {shift.comment && shift.comment.trim().length > 0 ? (
              <View style={styles.noteRow}>
                <Text variant="bodyLarge" style={styles.noteText} selectable>
                  {shift.comment}
                </Text>
                <IconButton
                  icon="pencil-outline"
                  size={20}
                  onPress={() => setNoteModalVisible(true)}
                  accessibilityLabel={t("shiftDetails.editNote")}
                />
              </View>
            ) : (
              <Button
                icon="note-plus-outline"
                mode="text"
                onPress={() => setNoteModalVisible(true)}
                style={styles.addNoteBtn}
              >
                {t("shiftDetails.addNote")}
              </Button>
            )}

            {/* שורה תחתונה - סה"כ ברוטו */}
            <View style={styles.totalContainer}>
              <Text variant="headlineSmall" style={styles.totalLabel}>
                {t("shiftDetails.totalBruto")}
              </Text>
              <Text variant="headlineSmall" style={styles.totalValue}>
                ₪{money(b.total)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <ShiftNoteModal
        visible={noteModalVisible}
        onDismiss={() => setNoteModalVisible(false)}
        shift={shift}
        onSaved={(comment) => setShift((prev) => ({ ...prev, comment }))}
      />
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    headerLeft: {
      flexDirection: "row",
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
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 10,
    },
    label: {
      color: theme.colors.onSurface,
      opacity: 0.7,
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    // Mixed number+word values ("8 שעות") need an explicit direction;
    // without it the number renders after the word for Hebrew readers.
    value: {
      fontWeight: "bold",
      color: theme.colors.onSurface,
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    ruleText: {
      color: theme.colors.onSurface,
      opacity: 0.6,
      textAlign: isRTL ? "right" : "left",
      marginBottom: 12,
    },
    bTable: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 12,
      overflow: "hidden",
      marginTop: 4,
    },
    bRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    bHeader: {
      backgroundColor: theme.colors.secondaryContainer,
      paddingVertical: 8,
    },
    bHeaderText: {
      color: theme.colors.onSecondaryContainer,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    bLabelCell: { flex: 2.1 },
    bLabel: {
      color: theme.colors.onSurface,
      textAlign: isRTL ? "right" : "left",
    },
    bNum: {
      color: theme.colors.onSurface,
      textAlign: isRTL ? "left" : "right",
      fontVariant: ["tabular-nums"],
    },
    bHours: { flex: 0.8 },
    bRate: { flex: 1.1, opacity: 0.7 },
    bAmount: { flex: 1.3, fontWeight: "600" },
    bSubtotal: {
      backgroundColor: theme.colors.outlineVariant + "40",
    },
    bSubtotalLabel: { fontWeight: "700", color: theme.colors.onSurface },
    totalContainer: {
      marginTop: 25,
      paddingTop: 20,
      borderTopWidth: 2,
      borderTopColor: theme.colors.outlineVariant,
      flexDirection: "row",
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
    noteRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      backgroundColor: theme.colors.outlineVariant + "55",
      borderRadius: 12,
      padding: 12,
    },
    noteText: {
      flex: 1,
      color: theme.colors.onSurface,
      textAlign: isRTL ? "right" : "left",
    },
    addNoteBtn: {
      alignSelf: isRTL ? "flex-end" : "flex-start",
    },
  });
