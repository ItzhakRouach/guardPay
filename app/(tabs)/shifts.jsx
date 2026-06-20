import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { ActivityIndicator, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Eyebrow from "../../components/common/Eyebrow";
import HeroCard from "../../components/common/HeroCard";
import Icon from "../../components/common/Icon";
import MonthHeader from "../../components/common/MonthHeader";
import Type from "../../components/common/Type";
import ShiftRow from "../../components/shifts/ShiftRow";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";
import { useMonthlySalary } from "../../hooks/useMonthlySalary";
import { useMonthNav } from "../../hooks/useMonthNav";
import { useShift } from "../../hooks/useShift";
import { DATABASE_ID, databases, SHIFTS_HISTORY } from "../../lib/appwrite";
import { screenContentLayout, useContentInset } from "../../lib/responsive";
import { restreakSickUpdates } from "../../utils/sickDays";

// Calendar week-of-month, Sunday→Saturday. Days before the month's first
// Sunday fall in week 1; each Sunday starts a new week. A month can span up
// to 6 such weeks (e.g. a 31-day month starting on a Saturday).
function weekOfMonth(d) {
  const firstWeekday = new Date(d.getFullYear(), d.getMonth(), 1).getDay(); // 0 = Sun
  return Math.ceil((d.getDate() + firstWeekday) / 7);
}

function groupByWeek(shifts) {
  const groups = {};
  shifts.forEach((s) => {
    const d = new Date(s.start_time);
    if (Number.isNaN(d.getTime())) return;
    const wk = weekOfMonth(d);
    if (!groups[wk]) groups[wk] = [];
    groups[wk].push(s);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([wk, rows]) => ({ wk: Number(wk), rows }));
}

function EmptyState() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 60,
        paddingHorizontal: 24,
      }}
    >
      <Icon name="calendar" size={48} color={theme.colors.muted} stroke={1.4} />
      <Type
        variant="sectionTitle"
        color={theme.colors.ink}
        style={{ marginTop: 16, textAlign: "center" }}
      >
        {t("shifts.empty.title")}
      </Type>
      <Type
        variant="body"
        color={theme.colors.muted}
        align="center"
        style={{ marginTop: 6, maxWidth: 260 }}
      >
        {t("shifts.empty.body")}
      </Type>
    </View>
  );
}

function FAB({ onPress, isRTL }) {
  const theme = useTheme();
  // Anchor the FAB to the centered content edge on iPad so it doesn't
  // drift across an empty gutter. On phones the inset is 0 and the
  // FAB sits at the screen edge as before.
  const inset = useContentInset();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({
        position: "absolute",
        bottom: 24,
        [isRTL ? "left" : "right"]: inset + 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.cta,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: theme.colors.ink,
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      <Icon name="plus" size={28} color={theme.colors.ctaInk} stroke={2.2} />
    </Pressable>
  );
}

function SwipeAction({ label, color, icon }) {
  return (
    <View
      style={{
        backgroundColor: color,
        justifyContent: "center",
        alignItems: "center",
        width: 84,
        marginVertical: 0,
      }}
    >
      <Icon name={icon} size={22} color="#FFFFFF" />
      <Type
        variant="small"
        color="#FFFFFF"
        style={{ marginTop: 4, fontFamily: "Manrope_600SemiBold" }}
      >
        {label}
      </Type>
    </View>
  );
}

export default function ShiftsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { currentDate, prev, next } = useMonthNav();
  const { shifts, loading, setShifts } = useShift(user, currentDate);
  const { totals, monthlyReport, salaryLoading } = useMonthlySalary(
    shifts,
    currentDate,
    loading,
  );
  const { isRTL } = useLanguage();
  const { t } = useTranslation();

  // Spans multi-step mutations (delete + re-stream of surrounding sick docs)
  // so the user doesn't see the list flash between the intermediate states.
  const [isProcessing, setIsProcessing] = useState(false);

  const groups = useMemo(() => groupByWeek(shifts || []), [shifts]);

  // After a sick doc is deleted, surrounding sick docs in the same streak
  // need their positions (and therefore sick_percent/total_amount)
  // recomputed. Each doc's total_amount is derived from its own base_rate
  // × 8 (the wage at the time of logging), so this works even when
  // profile is momentarily unloaded.
  const restreakAfterSickDelete = async () => {
    const fallbackDailyPay = (Number(profile?.price_per_hour) || 0) * 8;
    const res = await databases.listDocuments(DATABASE_ID, SHIFTS_HISTORY, [
      Query.equal("user_id", user.$id),
      Query.equal("is_sick", true),
      Query.limit(500),
    ]);
    const updates = restreakSickUpdates(res.documents, fallbackDailyPay);
    await Promise.all(
      updates.map((u) =>
        databases.updateDocument(DATABASE_ID, SHIFTS_HISTORY, u.$id, {
          sick_percent: u.sick_percent,
          total_amount: u.total_amount,
        }),
      ),
    );
    setShifts((prev) =>
      prev.map((s) => {
        const u = updates.find((x) => x.$id === s.$id);
        return u
          ? { ...s, sick_percent: u.sick_percent, total_amount: u.total_amount }
          : s;
      }),
    );
  };

  const performDelete = async (shiftId) => {
    const doc = shifts.find((s) => s.$id === shiftId);
    const needsRestreak = !!doc?.is_sick;
    if (needsRestreak) setIsProcessing(true);
    try {
      await databases.deleteDocument(DATABASE_ID, SHIFTS_HISTORY, shiftId);
      setShifts((prev) => prev.filter((s) => s.$id !== shiftId));
      if (needsRestreak) {
        await restreakAfterSickDelete();
      }
    } catch (err) {
      console.error("ShiftsScreen: delete failed", err);
      Alert.alert(t("shifts.delete_confirm_title"), String(err?.message || err));
    } finally {
      if (needsRestreak) setIsProcessing(false);
    }
  };

  // Tracks each shift's Swipeable ref so we can close the row when the
  // user cancels the delete confirm — otherwise the row stays open
  // behind the dismissed Alert.
  const swipeableRefs = useRef({});
  const closeRow = (shiftId) => {
    swipeableRefs.current[shiftId]?.close?.();
  };

  const handleEdit = (shift) => {
    // Editing a sick day in the standard add-shift form would clobber
    // its date-range / streak-percent contract. Until a dedicated sick
    // edit flow exists, force the user to delete + re-create.
    if (shift.is_sick) {
      Alert.alert(
        t("shifts.sick_edit_blocked_title"),
        t("shifts.sick_edit_blocked_body"),
        [{ text: "OK", onPress: () => closeRow(shift.$id) }],
      );
      return;
    }
    closeRow(shift.$id);
    router.push({
      pathname: "/add-shift",
      params: { shiftId: shift.$id, existingData: JSON.stringify(shift) },
    });
  };

  const handleDelete = (shiftId) => {
    Alert.alert(
      t("shifts.delete_confirm_title"),
      t("shifts.delete_confirm_body"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
          onPress: () => closeRow(shiftId),
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => performDelete(shiftId),
        },
      ],
      { onDismiss: () => closeRow(shiftId) },
    );
  };

  const openDetails = (shift) => {
    router.push({
      pathname: "/shift-details",
      params: { shiftData: JSON.stringify(shift) },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          ...screenContentLayout,
          paddingHorizontal: 24,
          paddingTop: insets.top + 8,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <MonthHeader
          eyebrow={`${shifts.length} ${t("shifts.count")} · ${(
            totals.totalHours || 0
          ).toFixed(1)} ${t("shifts.hoursUnit")}`}
          currentDate={currentDate}
          onPrev={prev}
          onNext={next}
        />
        <View style={{ height: 18 }} />

        <HeroCard>
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              padding: 22,
            }}
          >
            <View style={{ flex: 1 }}>
              <Eyebrow color={theme.colors.muted}>
                {t("shifts.anchor.monthly")}
              </Eyebrow>
              {!monthlyReport && salaryLoading ? (
                <ActivityIndicator
                  color={theme.colors.accent}
                  size="small"
                  style={{ marginTop: 8, alignSelf: "flex-start" }}
                />
              ) : (
                <Type
                  variant="sectionTitle"
                  color={theme.colors.ink}
                  style={{ marginTop: 6 }}
                >
                  {`${Math.round(monthlyReport?.bruto || 0).toLocaleString(
                    "en-US",
                  )} ₪`}
                </Type>
              )}
              <Type
                variant="small"
                color={theme.colors.muted}
                style={{ marginTop: 2 }}
              >
                {`+${Math.round(totals.travelPay || 0).toLocaleString(
                  "en-US",
                )} ₪ ${t("shifts.anchor.travel")}`}
              </Type>
            </View>
            <View
              style={{
                width: 1,
                backgroundColor: theme.colors.borderSoft,
                marginHorizontal: 16,
              }}
            />
            <View style={{ flex: 1 }}>
              <Eyebrow color={theme.colors.muted}>
                {t("shifts.anchor.hours")}
              </Eyebrow>
              <Type
                variant="sectionTitle"
                color={theme.colors.ink}
                style={{ marginTop: 6 }}
              >
                {`${(totals.totalHours || 0).toFixed(1)}h`}
              </Type>
              <Type
                variant="small"
                color={theme.colors.muted}
                style={{ marginTop: 2 }}
              >
                {`${totals.totalShifts || 0} ${t("shifts.anchor.shifts")}`}
              </Type>
            </View>
          </View>
        </HeroCard>

        {loading || isProcessing ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
          </View>
        ) : shifts.length === 0 ? (
          <EmptyState />
        ) : (
          groups.map(({ wk, rows }) => (
            <View key={wk} style={{ marginTop: 22 }}>
              <Eyebrow color={theme.colors.muted}>
                {`${t("shifts.week")} ${wk}`}
              </Eyebrow>
              <View
                style={{
                  marginTop: 10,
                  borderRadius: 18,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  overflow: "hidden",
                }}
              >
                {rows.map((shift, i) => {
                  // In RTL the user's natural "swipe inward" direction is
                  // visually right-to-left, so the destructive (delete)
                  // gesture must live on the trailing edge — which is
                  // `renderLeftActions` when the locale is RTL.
                  const editAction = (
                    <SwipeAction
                      label={t("common.edit")}
                      color={theme.colors.accent}
                      icon="edit"
                    />
                  );
                  const deleteAction = (
                    <SwipeAction
                      label={t("common.delete")}
                      color={theme.colors.neg}
                      icon="trash"
                    />
                  );
                  return (
                    <Swipeable
                      key={shift.$id || `s-${i}`}
                      ref={(r) => {
                        if (r) swipeableRefs.current[shift.$id] = r;
                        else delete swipeableRefs.current[shift.$id];
                      }}
                      renderLeftActions={() =>
                        isRTL ? deleteAction : editAction
                      }
                      renderRightActions={() =>
                        isRTL ? editAction : deleteAction
                      }
                      onSwipeableLeftOpen={() =>
                        isRTL ? handleDelete(shift.$id) : handleEdit(shift)
                      }
                      onSwipeableRightOpen={() =>
                        isRTL ? handleEdit(shift) : handleDelete(shift.$id)
                      }
                    >
                      <Pressable onPress={() => openDetails(shift)}>
                        <ShiftRow
                          shift={shift}
                          profile={profile}
                          isLast={i === rows.length - 1}
                        />
                      </Pressable>
                    </Swipeable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <FAB onPress={() => router.push("/add-shift")} isRTL={isRTL} />
    </View>
  );
}
