import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import MonthGrid from "../../components/shifts/MonthGrid";
import ShiftRow from "../../components/shifts/ShiftRow";
import { useAuth } from "../../hooks/auth-context";
import { useLanguage } from "../../hooks/lang-context";
import { useMonthlySalary } from "../../hooks/useMonthlySalary";
import { useMonthNav } from "../../hooks/useMonthNav";
import { useShift } from "../../hooks/useShift";
import { DATABASE_ID, databases, SHIFTS_HISTORY } from "../../lib/appwrite";
import { listAllDocuments } from "../../lib/appwriteList";
import { bucketByDay, dayTotals, weekOfMonth } from "../../lib/monthGrid";
import { parseOvertimeRules } from "../../lib/overtimeRules";
import { screenContentLayout, useContentInset } from "../../lib/responsive";
import { applyWeekUpdates, fetchWeekDocs } from "../../lib/weeklyOt";
import { isWorkedDoc, recomputeWeek } from "../../lib/weeklyOtCore";
import { radius, spacing } from "../../lib/theme";
import { localeFromLang } from "../../lib/utils";
import { restreakSickUpdates } from "../../utils/sickDays";

// Week-of-month and the day buckets come from utils/monthGrid.js, the one
// place that knows a month's shape. The calendar grid, this list and the
// Overview chart all read it, so they cannot drift apart.
const VIEW_KEY = "shifts-view";

function groupByWeek(shifts) {
  const groups = {};
  for (const s of shifts) {
    const d = new Date(s.start_time);
    if (Number.isNaN(d.getTime())) continue;
    const wk = weekOfMonth(d);
    (groups[wk] = groups[wk] || []).push(s);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([wk, rows]) => ({ wk: Number(wk), rows }));
}

function ViewToggle({ value, onChange, isRTL }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const item = (key, icon, label) => {
    const on = value === key;
    return (
      <Pressable
        onPress={() => onChange(key)}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        accessibilityLabel={label}
        style={{
          flex: 1,
          paddingVertical: 9,
          borderRadius: radius.control - 2,
          backgroundColor: on ? theme.colors.surface : "transparent",
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Icon
          name={icon}
          size={16}
          color={on ? theme.colors.ink : theme.colors.muted}
        />
        <Type
          variant="smallLabel"
          color={on ? theme.colors.ink : theme.colors.muted}
        >
          {label}
        </Type>
      </Pressable>
    );
  };
  return (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: radius.control,
        padding: 3,
        gap: 3,
      }}
    >
      {item("calendar", "calendar", t("shifts.view_calendar"))}
      {item("list", "list", t("shifts.view_list"))}
    </View>
  );
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
  const theme = useTheme();
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
      <Icon name={icon} size={22} color={theme.colors.ctaInk} />
      <Type
        variant="small"
        color={theme.colors.ctaInk}
        style={{ marginTop: 4 }}
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
  const {
    shifts,
    loading,
    setShifts,
    refetch,
    error: shiftsError,
  } = useShift(user, currentDate);
  const { totals, monthlyReport, salaryLoading } = useMonthlySalary(
    shifts,
    currentDate,
    loading,
    shiftsError,
  );
  const { isRTL, lang } = useLanguage();
  const { t } = useTranslation();

  // Spans multi-step mutations (delete + re-stream of surrounding sick docs)
  // so the user doesn't see the list flash between the intermediate states.
  const [isProcessing, setIsProcessing] = useState(false);

  const groups = useMemo(() => groupByWeek(shifts || []), [shifts]);

  // Calendar or list, remembered across launches beside the language and
  // colour-scheme preferences.
  const [view, setView] = useState(null); // null until the stored choice loads
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(VIEW_KEY)
      .then((v) => {
        if (!cancelled) setView(v === "calendar" ? "calendar" : "list");
      })
      .catch(() => {
        if (!cancelled) setView("list");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const chooseView = (next) => {
    setView(next);
    AsyncStorage.setItem(VIEW_KEY, next).catch(() => {
      // A remembered preference is a convenience, not load-bearing.
    });
  };

  const [selectedDay, setSelectedDay] = useState(null);
  // The selection belongs to the month on screen: drop it when the month
  // changes so a stale day never highlights the wrong cell.
  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
  const [lastMonthKey, setLastMonthKey] = useState(monthKey);
  if (lastMonthKey !== monthKey) {
    setLastMonthKey(monthKey);
    setSelectedDay(null);
  }

  const byDay = useMemo(() => bucketByDay(shifts || []), [shifts]);
  const daysShifts = useMemo(
    () => (selectedDay ? byDay[selectedDay] || [] : []),
    [byDay, selectedDay],
  );
  const dayTotal = useMemo(() => dayTotals(daysShifts), [daysShifts]);

  // Add Shift opens on the day you are looking at, not on today. A selected
  // day wins; otherwise today when this is the current month; otherwise the
  // first of the month on screen.
  const addShiftDate = useMemo(() => {
    const now = new Date();
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    if (selectedDay) return new Date(y, m, selectedDay);
    if (now.getFullYear() === y && now.getMonth() === m) return now;
    return new Date(y, m, 1);
  }, [currentDate, selectedDay]);
  const openAddShift = () =>
    router.push({
      pathname: "/add-shift",
      params: { dateIso: addShiftDate.toISOString() },
    });

  // After a sick doc is deleted, surrounding sick docs in the same streak
  // need their positions (and therefore sick_percent/total_amount)
  // recomputed. Each doc's total_amount is derived from its own base_rate
  // × 8 (the wage at the time of logging), so this works even when
  // profile is momentarily unloaded.
  const restreakAfterSickDelete = async () => {
    const fallbackDailyPay = (Number(profile?.price_per_hour) || 0) * 8;
    // Paginated: the old Query.limit(500) silently dropped sick docs for a
    // heavy user, which recomputed the streak on a partial history.
    const sickDocs = await listAllDocuments(DATABASE_ID, SHIFTS_HISTORY, [
      Query.equal("user_id", user.$id),
      Query.equal("is_sick", true),
      Query.orderAsc("start_time"),
    ]);
    const updates = restreakSickUpdates(sickDocs, fallbackDailyPay);
    const results = await Promise.allSettled(
      updates.map((u) =>
        databases.updateDocument(DATABASE_ID, SHIFTS_HISTORY, u.$id, {
          sick_percent: u.sick_percent,
          total_amount: u.total_amount,
        }),
      ),
    );
    const applied = new Set(
      results.flatMap((r, i) =>
        r.status === "fulfilled" ? [updates[i].$id] : [],
      ),
    );
    setShifts((prev) =>
      prev.map((s) => {
        const u = applied.has(s.$id)
          ? updates.find((x) => x.$id === s.$id)
          : null;
        return u
          ? { ...s, sick_percent: u.sick_percent, total_amount: u.total_amount }
          : s;
      }),
    );
    const failed = results.length - applied.size;
    if (failed > 0) {
      // Don't leave a half-recomputed streak silent: say so, and resync the
      // month from the server so the screen shows what was actually saved.
      console.log(
        `[sick] restreak: ${failed}/${results.length} updates failed`,
      );
      Alert.alert(t("shifts.restreak_partial"));
      refetch();
    }
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
      // Weekly rule: the remaining shifts of that week may move back under
      // the 42h cap.
      const otRules = parseOvertimeRules(profile?.overtime_rules);
      if (otRules.weekly && isWorkedDoc(doc)) {
        const weekDocs = await fetchWeekDocs(user.$id, doc.start_time);
        const { failed } = await applyWeekUpdates(
          recomputeWeek(weekDocs, otRules),
        );
        if (failed) {
          Alert.alert(t("shifts.week_partial"));
          refetch();
        }
      }
    } catch (err) {
      console.error("ShiftsScreen: delete failed", err);
      Alert.alert(
        t("shifts.delete_confirm_title"),
        String(err?.message || err),
      );
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

  // One definition of a swipeable shift row, used by both views.
  //
  // In RTL the user's natural "swipe inward" direction is visually
  // right-to-left, so the destructive gesture must live on the trailing
  // edge — which is `renderLeftActions` when the locale is RTL.
  const renderSwipeableRow = (shift, i, count) => {
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
        renderLeftActions={() => (isRTL ? deleteAction : editAction)}
        renderRightActions={() => (isRTL ? editAction : deleteAction)}
        onSwipeableLeftOpen={() =>
          isRTL ? handleDelete(shift.$id) : handleEdit(shift)
        }
        onSwipeableRightOpen={() =>
          isRTL ? handleEdit(shift) : handleDelete(shift.$id)
        }
      >
        <Pressable onPress={() => openDetails(shift)}>
          <ShiftRow shift={shift} profile={profile} isLast={i === count - 1} />
        </Pressable>
      </Swipeable>
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
        <View style={{ height: spacing.section }} />
        <ViewToggle value={view} onChange={chooseView} isRTL={isRTL} />
        <View style={{ height: spacing.section }} />

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

        {shiftsError && !loading ? (
          <Type
            variant="small"
            color={theme.colors.neg}
            style={{ marginTop: 14, textAlign: "center" }}
          >
            {t("service.refresh_failed")}
          </Type>
        ) : null}

        {loading || isProcessing || view === null ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
          </View>
        ) : view === "calendar" ? (
          <>
            <MonthGrid
              currentDate={currentDate}
              shifts={shifts}
              profile={profile}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
            {selectedDay ? (
              <View style={{ marginTop: spacing.section }}>
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    paddingHorizontal: 2,
                    paddingBottom: 8,
                  }}
                >
                  <Type variant="sectionTitle" color={theme.colors.ink}>
                    {new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      selectedDay,
                    ).toLocaleDateString(localeFromLang(lang), {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </Type>
                  {dayTotal.count ? (
                    <Type variant="small" color={theme.colors.muted}>
                      {`${dayTotal.hours} ${t("shifts.hoursUnit")}`}
                    </Type>
                  ) : null}
                </View>

                {dayTotal.count === 0 ? (
                  <View
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: radius.card,
                      paddingVertical: 22,
                      paddingHorizontal: spacing.cardH,
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Type variant="body" color={theme.colors.muted}>
                      {t("shifts.day_none")}
                    </Type>
                    <Pressable
                      onPress={openAddShift}
                      accessibilityRole="button"
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 18,
                        borderRadius: radius.control,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Type variant="smallLabel" color={theme.colors.ink}>
                        {t("shifts.add_on_day")}
                      </Type>
                    </Pressable>
                  </View>
                ) : (
                  <View
                    style={{
                      borderRadius: radius.card,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      overflow: "hidden",
                    }}
                  >
                    {daysShifts.map((item, i) =>
                      renderSwipeableRow(item, i, daysShifts.length),
                    )}
                  </View>
                )}
              </View>
            ) : null}
          </>
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
                {rows.map((shift, i) =>
                  renderSwipeableRow(shift, i, rows.length),
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <FAB onPress={openAddShift} isRTL={isRTL} />
    </View>
  );
}
