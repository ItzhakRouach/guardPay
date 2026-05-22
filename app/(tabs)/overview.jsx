import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Animated, ScrollView, View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../../components/common/Buttons";
import Eyebrow from "../../components/common/Eyebrow";
import Hairline from "../../components/common/Hairline";
import HeroCard from "../../components/common/HeroCard";
import Icon from "../../components/common/Icon";
import MonthHeader from "../../components/common/MonthHeader";
import Type from "../../components/common/Type";
import { useAuth } from "../../hooks/auth-context";
import { useMonthlySalary } from "../../hooks/useMonthlySalary";
import { useMonthNav } from "../../hooks/useMonthNav";
import { usePrevMonthBruto } from "../../hooks/usePrevMonthBruto";
import { useShift } from "../../hooks/useShift";

const fmtCurrency = (n) =>
  Math.round(Number(n) || 0).toLocaleString("en-US");

function bucketByWeek(shifts) {
  const buckets = [0, 0, 0, 0, 0];
  (shifts || []).forEach((s) => {
    const d = new Date(s.start_time || s.date);
    if (Number.isNaN(d.getTime())) return;
    const wk = Math.min(4, Math.floor((d.getDate() - 1) / 7));
    buckets[wk] += Number(s.total_amount || 0);
  });
  return buckets;
}

function HeroSection({ neto, trendPct, profileName }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const animated = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(setReduceMotion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      animated.setValue(1);
      return;
    }
    animated.setValue(0);
    Animated.timing(animated, {
      toValue: 1,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [neto, reduceMotion, animated]);

  useEffect(() => {
    const id = animated.addListener(({ value }) => {
      setDisplay(Math.round(value * neto));
    });
    return () => animated.removeListener(id);
  }, [animated, neto]);

  const trendColor =
    trendPct == null
      ? theme.colors.muted
      : trendPct >= 0
        ? theme.colors.pos
        : theme.colors.neg;
  const trendIcon =
    trendPct == null ? null : trendPct >= 0 ? "arrow-up" : "arrow-down";

  return (
    <HeroCard style={{ padding: 28 }}>
      <Eyebrow color={theme.colors.muted}>{t("overview.heroLabel")}</Eyebrow>
      {profileName ? (
        <Type
          variant="body"
          color={theme.colors.inkSoft}
          style={{ marginTop: 2 }}
        >
          {profileName}
        </Type>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          marginTop: 12,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Type variant="hero" color={theme.colors.ink}>
          {fmtCurrency(display)}
        </Type>
        <Type
          variant="sectionTitle"
          color={theme.colors.muted}
          style={{ marginBottom: 6 }}
        >
          ₪
        </Type>
      </View>
      {trendPct != null ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 10,
            alignSelf: "flex-start",
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: theme.colors.accentSoft,
          }}
        >
          {trendIcon ? (
            <Icon name={trendIcon} size={14} color={trendColor} />
          ) : null}
          <Type variant="small" color={trendColor}>
            {`${trendPct >= 0 ? "+" : ""}${trendPct.toFixed(1)}% ${t(
              "overview.vsLast",
            )}`}
          </Type>
        </View>
      ) : null}
    </HeroCard>
  );
}

function StatTile({ label, value, suffix }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 18 }}>
      <Eyebrow color={theme.colors.muted}>{label}</Eyebrow>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 4,
          marginTop: 6,
        }}
      >
        <Type variant="statValue" color={theme.colors.ink}>
          {value}
        </Type>
        {suffix ? (
          <Type variant="small" color={theme.colors.muted}>
            {suffix}
          </Type>
        ) : null}
      </View>
    </View>
  );
}

function StatsGrid({ bruto, totalHours, totalShifts, deductions }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        marginTop: 16,
        borderRadius: 18,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: "hidden",
      }}
    >
      <View style={{ flexDirection: "row" }}>
        <StatTile
          label={t("overview.stats.bruto")}
          value={fmtCurrency(bruto)}
          suffix="₪"
        />
        <Hairline vertical />
        <StatTile
          label={t("overview.stats.hours")}
          value={Number(totalHours || 0).toFixed(1)}
          suffix="h"
        />
      </View>
      <Hairline />
      <View style={{ flexDirection: "row" }}>
        <StatTile
          label={t("overview.stats.shifts")}
          value={String(totalShifts || 0)}
        />
        <Hairline vertical />
        <StatTile
          label={t("overview.stats.deductions")}
          value={fmtCurrency(deductions)}
          suffix="₪"
        />
      </View>
    </View>
  );
}

function WeeklyChart({ buckets }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const max = Math.max(...buckets, 1);
  const peakIdx = buckets.indexOf(Math.max(...buckets));
  const [reduceMotion, setReduceMotion] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(setReduceMotion)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (reduceMotion) {
      anim.setValue(1);
      return;
    }
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [buckets, reduceMotion, anim]);

  return (
    <View
      style={{
        marginTop: 16,
        padding: 20,
        borderRadius: 18,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Eyebrow color={theme.colors.muted}>{t("overview.weekly")}</Eyebrow>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginTop: 16,
          height: 120,
        }}
      >
        {buckets.map((v, i) => {
          const ratio = v / max;
          const h = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [4, Math.max(4, 120 * ratio)],
          });
          const isPeak = i === peakIdx && v > 0;
          return (
            <View key={i} style={{ alignItems: "center", flex: 1 }}>
              {isPeak ? (
                <View
                  style={{
                    width: 28,
                    height: 4,
                    backgroundColor: theme.colors.accent,
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                  }}
                />
              ) : null}
              <Animated.View
                style={{
                  width: 28,
                  height: h,
                  backgroundColor: theme.colors.ink,
                  borderRadius: 2,
                  marginTop: isPeak ? 0 : 4,
                }}
              />
              <Type
                variant="smallLabel"
                color={theme.colors.muted}
                style={{ marginTop: 8 }}
              >
                {`W${i + 1}`}
              </Type>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function InsightsCard({ shiftsCount, avgShift, bestDay, projected }) {
  const theme = useTheme();
  const { t } = useTranslation();
  if (!shiftsCount) return null;
  const rows = [
    {
      label: t("overview.insights.avg"),
      value: `${fmtCurrency(avgShift)} ₪`,
    },
    {
      label: t("overview.insights.projected"),
      value: `${fmtCurrency(projected)} ₪`,
    },
    bestDay && {
      label: t("overview.insights.best"),
      value: bestDay,
    },
  ].filter(Boolean);

  return (
    <View
      style={{
        marginTop: 16,
        borderRadius: 18,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 20,
        paddingVertical: 4,
      }}
    >
      {rows.map((r, i) => (
        <View key={r.label}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Icon name="sparkle" size={16} color={theme.colors.accent} />
              <Type variant="body" color={theme.colors.inkSoft}>
                {r.label}
              </Type>
            </View>
            <Type variant="sheetValue" color={theme.colors.ink}>
              {r.value}
            </Type>
          </View>
          {i < rows.length - 1 ? <Hairline soft /> : null}
        </View>
      ))}
    </View>
  );
}

export default function OverviewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { currentDate, prev, next } = useMonthNav();
  const { shifts } = useShift(user, currentDate);
  const { monthlyReport, totals } = useMonthlySalary(shifts);
  const prevBruto = usePrevMonthBruto(user, currentDate);
  const { t, i18n } = useTranslation();

  const weeklyBuckets = useMemo(() => bucketByWeek(shifts), [shifts]);

  const trendPct = useMemo(() => {
    if (!monthlyReport) return null;
    if (prevBruto == null || prevBruto <= 0) return null;
    const curBruto = Number(monthlyReport.bruto || 0);
    return ((curBruto - prevBruto) / prevBruto) * 100;
  }, [monthlyReport, prevBruto]);

  const avgShift = totals.totalShifts
    ? (monthlyReport?.bruto || 0) / totals.totalShifts
    : 0;

  const bestDay = useMemo(() => {
    if (!shifts.length) return null;
    const byDow = new Array(7).fill(0);
    shifts.forEach((s) => {
      const d = new Date(s.start_time || s.date);
      if (Number.isNaN(d.getTime())) return;
      byDow[d.getDay()] += Number(s.total_amount || 0);
    });
    const maxIdx = byDow.indexOf(Math.max(...byDow));
    if (byDow[maxIdx] <= 0) return null;
    const sample = new Date(2024, 5, 9 + maxIdx);
    return sample.toLocaleDateString(i18n.language === "he" ? "he-IL" : "en-US", {
      weekday: "long",
    });
  }, [shifts, i18n.language]);

  const projected = useMemo(() => {
    if (!monthlyReport?.bruto) return 0;
    const now = new Date();
    const sameMonth =
      now.getFullYear() === currentDate.getFullYear() &&
      now.getMonth() === currentDate.getMonth();
    if (!sameMonth) return monthlyReport.bruto;
    const daysIn = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    ).getDate();
    return (monthlyReport.bruto / now.getDate()) * daysIn;
  }, [monthlyReport, currentDate]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {monthlyReport == null ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 8,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <MonthHeader
            eyebrow={t("overview.eyebrow")}
            currentDate={currentDate}
            onPrev={prev}
            onNext={next}
          />
          <View style={{ height: 20 }} />
          <HeroSection
            neto={monthlyReport?.neto || 0}
            trendPct={trendPct}
            profileName={profile?.user_name}
          />
          <StatsGrid
            bruto={monthlyReport?.bruto || 0}
            totalHours={totals.totalHours || 0}
            totalShifts={totals.totalShifts || 0}
            deductions={monthlyReport?.totalDeductions || 0}
          />
          <WeeklyChart buckets={weeklyBuckets} />
          <InsightsCard
            shiftsCount={totals.totalShifts || 0}
            avgShift={avgShift}
            bestDay={bestDay}
            projected={projected}
          />
          <View style={{ height: 24 }} />
          <PrimaryButton
            icon="document"
            label={t("overview.cta")}
            onPress={() =>
              router.push({
                pathname: "/paycheck",
                params: { monthIso: currentDate.toISOString() },
              })
            }
          />
        </ScrollView>
      )}
    </View>
  );
}
