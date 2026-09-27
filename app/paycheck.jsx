import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, View } from "react-native";
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
import { textEnd, textStart } from "../lib/theme";

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

function EarningsRow({ row, lang }) {
  const theme = useTheme();
  const qty = row.kind === "hours" ? `${row.hours.toFixed(2)}` : `${row.qty}`;
  const label = row.label;
  // The row reads [label | rate | qty | amount] in source order; the
  // app-wide layout direction mirrors it for Hebrew and Arabic.
  const numAlign = textEnd;
  const labelAlign = textStart;
  return (
    <View
      style={{
        flexDirection: "row",
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
        variant="small"
        numeric
        color={theme.colors.inkSoft}
        style={{ flex: 1, textAlign: numAlign }}
      >
        {fmt(row.rate)}
      </Type>
      <Type
        variant="small"
        numeric
        color={theme.colors.inkSoft}
        style={{ flex: 0.8, textAlign: numAlign }}
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

function EarningsTable({ model, lang }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const numAlign = textEnd;
  const labelAlign = textStart;
  return (
    <View style={{ marginTop: 4 }}>
      <View
        style={{
          flexDirection: "row",
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
        <EarningsRow key={r.key} row={r} lang={lang} />
      ))}
      <View
        style={{
          flexDirection: "row",
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
          style={{ marginStart: 4 }}
        >
          ₪
        </Type>
      </View>
    </View>
  );
}

// Credits (tax credit points, settlement benefit) reduce the tax. The PDF
// always printed them; the screen computed them and then never rendered
// them, so the two disagreed.
function CreditsTable({ model, lang }) {
  const theme = useTheme();
  const labelAlign = textStart;
  if (!model.credits || model.credits.length === 0) return null;
  return (
    <View style={{ marginTop: 4 }}>
      {model.credits.map((row, i) => (
        <View key={row.label}>
          <View
            style={{
              flexDirection: "row",
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
            <Type variant="rowAmount" color={theme.colors.pos}>
              {`+${fmt(Math.abs(row.amount))}`}
            </Type>
          </View>
          {i < model.credits.length - 1 ? <Hairline soft /> : null}
        </View>
      ))}
    </View>
  );
}

function DeductionsTable({ model, lang }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const labelAlign = textStart;
  return (
    <View style={{ marginTop: 4 }}>
      {model.summary.map((row, i) => (
        <View key={row.key}>
          <View
            style={{
              flexDirection: "row",
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
          flexDirection: "row",
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

function NetPayCard({ neto, bruto }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <AnchorCard radius={20} style={{ marginTop: 24, padding: 24 }}>
      <Eyebrow
        color={theme.colors.anchorMuted}
        style={{ textAlign: textStart }}
      >
        {t("paycheck.netPay")}
      </Eyebrow>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          marginTop: 8,
          gap: 6,
          justifyContent: "flex-start",
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
        style={{ marginTop: 8, textAlign: textStart }}
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
  const {
    shifts,
    loading: shiftsLoading,
    error: shiftsError,
  } = useShift(user, currentDate);
  const { monthlyReport, totals, salaryLoading } = useMonthlySalary(
    shifts,
    currentDate,
    shiftsLoading,
    shiftsError,
  );

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

  // Never export a payslip built from a month whose fetch failed — after a
  // month switch `shifts` is reset to [] before the fetch, so the PDF
  // would be an empty or partial month presented as real.
  const [exporting, setExporting] = useState(false);
  const exportBlocked = !!shiftsError || exporting;
  const onExport = async () => {
    if (!model || exportBlocked) return;
    setExporting(true);
    try {
      await handleGeneratePDF(
        totals,
        profile,
        currentDate,
        shifts,
        monthlyReport,
        lang,
      );
    } catch (err) {
      console.log("Paycheck export failed:", err?.message);
      Alert.alert(t("paycheck.export_err"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          flexDirection: "row",
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

      {exportBlocked ? (
        <Type
          variant="small"
          color={theme.colors.neg}
          style={{ marginTop: 10, paddingHorizontal: 24, textAlign: "center" }}
        >
          {t("service.refresh_failed")}
        </Type>
      ) : null}

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
          <EarningsTable model={model} lang={lang} />

          <SectionRule label={t("paycheck.deductions")} accent />
          <DeductionsTable model={model} lang={lang} />

          {model.credits && model.credits.length > 0 ? (
            <>
              <SectionRule label={t("paycheck.credits")} />
              <CreditsTable model={model} lang={lang} />
            </>
          ) : null}

          <NetPayCard neto={model.neto} bruto={model.bruto} />

          <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
            <OutlinedButton
              label={t("paycheck.export")}
              icon="document"
              onPress={onExport}
              disabled={exportBlocked}
              fullWidth={false}
              style={{ flex: 1 }}
            />
            <OutlinedButton
              label={t("paycheck.share")}
              icon="share"
              onPress={onExport}
              disabled={exportBlocked}
              fullWidth={false}
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
