import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnchorCard from "../components/common/AnchorCard";
import { GhostButton, OutlinedButton } from "../components/common/Buttons";
import Eyebrow from "../components/common/Eyebrow";
import Hairline from "../components/common/Hairline";
import Type from "../components/common/Type";
import { useAuth } from "../hooks/auth-context";
import { useLanguage } from "../hooks/lang-context";
import { useMonthlySalary } from "../hooks/useMonthlySalary";
import { useShift } from "../hooks/useShift";
import { handleGeneratePDF } from "../lib/GeneratePaycheck";
import { buildPaycheckModel } from "../lib/paycheckData";
import { screenContentLayout } from "../lib/responsive";
import { localeFromLang } from "../lib/utils";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function SectionRule({ label, accent = false }) {
  const theme = useTheme();
  const color = accent ? theme.colors.accent : theme.colors.ink;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 24,
        marginBottom: 8,
      }}
    >
      <View style={{ width: 24, height: 1, backgroundColor: color }} />
      <Eyebrow color={color}>{label}</Eyebrow>
    </View>
  );
}

function EarningsRow({ row, lang, isRTL }) {
  const theme = useTheme();
  const qty = row.kind === "hours" ? `${row.hours.toFixed(2)}` : `${row.qty}`;
  const label = row.label;
  // In Hebrew the row visually reads as [amount | qty | rate | label]
  // left-to-right. row-reverse on the flex container achieves this
  // while the JSX source order stays the same.
  const numAlign = isRTL ? "left" : "right";
  const labelAlign = isRTL ? "right" : "left";
  return (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSoft,
      }}
    >
      <Type
        variant="body"
        color={theme.colors.ink}
        style={{ flex: 2.2, textAlign: labelAlign }}
        lang={lang}
      >
        {label}
      </Type>
      <Type
        variant="numeric"
        color={theme.colors.inkSoft}
        style={{
          flex: 1,
          textAlign: numAlign,
          fontFamily: "Manrope_500Medium",
        }}
      >
        {fmt(row.rate)}
      </Type>
      <Type
        variant="numeric"
        color={theme.colors.inkSoft}
        style={{
          flex: 0.8,
          textAlign: numAlign,
          fontFamily: "Manrope_500Medium",
        }}
      >
        {qty}
      </Type>
      <Type
        variant="rowAmount"
        color={theme.colors.ink}
        style={{ flex: 1.4, textAlign: numAlign }}
      >
        {fmt(row.amount)}
      </Type>
    </View>
  );
}

function EarningsTable({ model, lang, isRTL }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const numAlign = isRTL ? "left" : "right";
  const labelAlign = isRTL ? "right" : "left";
  return (
    <View style={{ marginTop: 4 }}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <Type
          variant="smallLabel"
          color={theme.colors.muted}
          style={{ flex: 2.2, textAlign: labelAlign }}
        >
          {t("paycheck.col.item")}
        </Type>
        <Type
          variant="smallLabel"
          color={theme.colors.muted}
          style={{ flex: 1, textAlign: numAlign }}
        >
          {t("paycheck.col.rate")}
        </Type>
        <Type
          variant="smallLabel"
          color={theme.colors.muted}
          style={{ flex: 0.8, textAlign: numAlign }}
        >
          {t("paycheck.col.qty")}
        </Type>
        <Type
          variant="smallLabel"
          color={theme.colors.muted}
          style={{ flex: 1.4, textAlign: numAlign }}
        >
          {t("paycheck.col.amount")}
        </Type>
      </View>
      {model.earnings.map((r) => (
        <EarningsRow key={r.key} row={r} lang={lang} isRTL={isRTL} />
      ))}
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          paddingTop: 14,
          marginTop: 6,
          borderTopWidth: 1.5,
          borderTopColor: theme.colors.ink,
          alignItems: "baseline",
        }}
      >
        <Type
          variant="helperItalic"
          color={theme.colors.ink}
          style={{ flex: 1, textAlign: labelAlign }}
        >
          {t("paycheck.grossTotal")}
        </Type>
        <Type variant="rowAmount" color={theme.colors.ink}>
          {fmt(model.bruto)}
        </Type>
        <Type
          variant="body"
          color={theme.colors.muted}
          style={isRTL ? { marginRight: 4 } : { marginLeft: 4 }}
        >
          ₪
        </Type>
      </View>
    </View>
  );
}

function DeductionsTable({ model, lang, isRTL }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const labelAlign = isRTL ? "right" : "left";
  return (
    <View style={{ marginTop: 4 }}>
      {model.summary.map((row, i) => (
        <View key={row.key}>
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <Type
              variant="body"
              color={theme.colors.inkSoft}
              lang={lang}
              style={{ textAlign: labelAlign }}
            >
              {row.label}
            </Type>
            <Type variant="rowAmount" color={theme.colors.neg}>
              {`-${fmt(row.amount)}`}
            </Type>
          </View>
          {i < model.summary.length - 1 ? <Hairline soft /> : null}
        </View>
      ))}
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          paddingTop: 14,
          marginTop: 6,
          borderTopWidth: 1.5,
          borderTopColor: theme.colors.accent,
          alignItems: "baseline",
        }}
      >
        <Type
          variant="helperItalic"
          color={theme.colors.ink}
          style={{ flex: 1, textAlign: labelAlign }}
        >
          {t("paycheck.totalDeductions")}
        </Type>
        <Type variant="rowAmount" color={theme.colors.neg}>
          {`-${fmt(model.totalDeductions)}`}
        </Type>
      </View>
    </View>
  );
}

function NetPayCard({ neto, bruto, isRTL }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <AnchorCard radius={20} style={{ marginTop: 24, padding: 24 }}>
      <Eyebrow
        color={theme.colors.anchorMuted}
        style={{ textAlign: isRTL ? "right" : "left" }}
      >
        {t("paycheck.netPay")}
      </Eyebrow>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "baseline",
          marginTop: 8,
          gap: 6,
          justifyContent: isRTL ? "flex-end" : "flex-start",
        }}
      >
        <Type variant="netPay" color={theme.colors.anchorInk}>
          {fmt(neto)}
        </Type>
        <Type
          variant="sectionTitle"
          color={theme.colors.anchorMuted}
          style={{ marginBottom: 4 }}
        >
          ₪
        </Type>
      </View>
      <Type
        variant="helperItalic"
        color={theme.colors.anchorMuted}
        style={{ marginTop: 8, textAlign: isRTL ? "right" : "left" }}
      >
        {`${t("paycheck.of")} ${fmt(bruto)} ₪ ${t("paycheck.gross")}`}
      </Type>
    </AnchorCard>
  );
}

export default function PaycheckScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { lang, isRTL } = useLanguage();
  const { user, profile } = useAuth();
  const { monthIso } = useLocalSearchParams();
  const currentDate = useMemo(
    () => (monthIso ? new Date(String(monthIso)) : new Date()),
    [monthIso],
  );
  const { shifts, loading: shiftsLoading } = useShift(user, currentDate);
  const { monthlyReport, totals } = useMonthlySalary(shifts, currentDate);

  const model = useMemo(
    () =>
      monthlyReport
        ? buildPaycheckModel({
            profile,
            shifts,
            totals,
            monthlyReport,
            lang,
          })
        : null,
    [profile, shifts, totals, monthlyReport, lang],
  );

  const locale = localeFromLang(i18n.language);
  const month = currentDate.toLocaleDateString(locale, { month: "long" });
  const year = String(currentDate.getFullYear());

  const onExport = () => {
    if (!model) return;
    handleGeneratePDF(
      totals,
      profile,
      currentDate,
      shifts,
      monthlyReport,
      lang,
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + 8,
          paddingHorizontal: 24,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderSoft,
          backgroundColor: theme.colors.bg,
        }}
      >
        <GhostButton
          icon={isRTL ? "chev-right" : "chev-left"}
          onPress={() => router.back()}
        />
        <Eyebrow color={theme.colors.muted}>{t("paycheck.title")}</Eyebrow>
        <GhostButton icon="share" onPress={onExport} />
      </View>

      {!model || shiftsLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            ...screenContentLayout,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <Eyebrow color={theme.colors.accent}>GUARDPAY</Eyebrow>
            <Type
              variant="h1"
              color={theme.colors.ink}
              style={{ marginTop: 6 }}
            >
              {t("paycheck.statement")}
            </Type>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 6,
                marginTop: 2,
              }}
            >
              <Type variant="yearItalic" color={theme.colors.inkSoft}>
                {month}
              </Type>
              <Type variant="yearItalic" color={theme.colors.muted}>
                {year}
              </Type>
            </View>
            {profile?.user_name ? (
              <Type
                variant="body"
                color={theme.colors.muted}
                style={{ marginTop: 10 }}
              >
                {profile.user_name}
              </Type>
            ) : null}
          </View>

          <Hairline />

          <SectionRule label={t("paycheck.earnings")} />
          <EarningsTable model={model} lang={lang} isRTL={isRTL} />

          <SectionRule label={t("paycheck.deductions")} accent />
          <DeductionsTable model={model} lang={lang} isRTL={isRTL} />

          <NetPayCard neto={model.neto} bruto={model.bruto} isRTL={isRTL} />

          <View
            style={{ flexDirection: "row", gap: 12, marginTop: 24 }}
          >
            <OutlinedButton
              label={t("paycheck.export")}
              icon="document"
              onPress={onExport}
              fullWidth={false}
              style={{ flex: 1 }}
            />
            <OutlinedButton
              label={t("paycheck.share")}
              icon="share"
              onPress={onExport}
              fullWidth={false}
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
