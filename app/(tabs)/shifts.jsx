import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "react-native-paper";
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

function groupByWeek(shifts) {
  const groups = {};
  shifts.forEach((s) => {
    const d = new Date(s.start_time);
    if (Number.isNaN(d.getTime())) return;
    const wk = Math.min(5, Math.floor((d.getDate() - 1) / 7) + 1);
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
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({
        position: "absolute",
        bottom: 24,
        [isRTL ? "left" : "right"]: 20,
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
  const { shifts, setShifts } = useShift(user, currentDate);
  const { totals, monthlyReport } = useMonthlySalary(shifts);
  const { isRTL } = useLanguage();
  const { t } = useTranslation();

  const groups = useMemo(() => groupByWeek(shifts || []), [shifts]);

  const handleEdit = (shift) => {
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
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await databases.deleteDocument(
                DATABASE_ID,
                SHIFTS_HISTORY,
                shiftId,
              );
              setShifts((prev) => prev.filter((s) => s.$id !== shiftId));
            } catch (err) {
              console.log(err);
            }
          },
        },
      ],
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
          <View style={{ flexDirection: "row", padding: 22 }}>
            <View style={{ flex: 1 }}>
              <Eyebrow color={theme.colors.muted}>
                {t("shifts.anchor.monthly")}
              </Eyebrow>
              <Type
                variant="sectionTitle"
                color={theme.colors.ink}
                style={{ marginTop: 6 }}
              >
                {`${Math.round(monthlyReport?.bruto || 0).toLocaleString(
                  "en-US",
                )} ₪`}
              </Type>
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

        {shifts.length === 0 ? (
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
                {rows.map((shift, i) => (
                  <Swipeable
                    key={shift.$id || `s-${i}`}
                    renderLeftActions={() => (
                      <SwipeAction
                        label={t("common.edit") || "Edit"}
                        color={theme.colors.accent}
                        icon="edit"
                      />
                    )}
                    renderRightActions={() => (
                      <SwipeAction
                        label={t("common.delete")}
                        color={theme.colors.neg}
                        icon="trash"
                      />
                    )}
                    onSwipeableLeftOpen={() => handleEdit(shift)}
                    onSwipeableRightOpen={() => handleDelete(shift.$id)}
                  >
                    <Pressable onPress={() => openDetails(shift)}>
                      <ShiftRow
                        shift={shift}
                        profile={profile}
                        isLast={i === rows.length - 1}
                      />
                    </Pressable>
                  </Swipeable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <FAB onPress={() => router.push("/add-shift")} isRTL={isRTL} />
    </View>
  );
}
