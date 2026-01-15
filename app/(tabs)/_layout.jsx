import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index" disablePopToTop>
        <Label>{t("tabs.profile")}</Label>
        <Icon sf="gearshape.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="shifts" disablePopToTop>
        <Label>{t("tabs.shifts")}</Label>
        <Icon sf="calendar.badge.plus" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="overview">
        <Label>{t("tabs.overview")}</Label>
        <Icon sf="chart.bar.xaxis.ascending" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
