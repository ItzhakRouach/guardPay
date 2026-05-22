import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { OutlinedButton, PrimaryButton } from "../../components/common/Buttons";
import Eyebrow from "../../components/common/Eyebrow";
import Pill from "../../components/common/Pill";
import Type from "../../components/common/Type";
import { useLanguage } from "../../hooks/lang-context";
import { screenContentLayout } from "../../lib/responsive";

export default function OnBoardingScreen() {
  const { t } = useTranslation();
  const { lang, changeLanguage } = useLanguage();
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          ...screenContentLayout,
          flexDirection: "row",
          justifyContent: "flex-end",
          padding: 24,
        }}
      >
        <Pill
          value={lang}
          options={[
            { label: "EN", value: "en" },
            { label: "HE", value: "he" },
            { label: "AR", value: "ar" },
          ]}
          onChange={changeLanguage}
        />
      </View>
      <View
        style={{
          ...screenContentLayout,
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 28,
        }}
      >
        {/*
          Logo lives inside a rounded-square clip mask so the shield
          renders as a polished iOS-app-icon shape — no jagged edges,
          no apparent background, just the brand mark inside a soft
          22%-radius square (iOS app-icon spec).
          Uses icon_transparent.png; resizeMode="contain" keeps the
          shield's natural padding within the clip.
        */}
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 27,
            overflow: "hidden",
            backgroundColor: theme.colors.surface,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: theme.colors.ink,
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 4,
          }}
        >
          <Image
            source={require("../../assets/images/icon_transparent.png")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        </View>
        <View style={{ height: 24 }} />
        <Eyebrow color={theme.colors.accent}>{t("welcome.eyebrow")}</Eyebrow>
        <Type
          variant="welcomeTitle"
          color={theme.colors.ink}
          align="center"
          style={{ marginTop: 8, lineHeight: 64 }}
        >
          GuardPay
        </Type>
        <Type
          variant="welcomeSub"
          color={theme.colors.inkSoft}
          align="center"
          style={{ marginTop: 6, lineHeight: 38 }}
        >
          {t("welcome.subtitle")}
        </Type>
        <Type
          variant="pitch"
          color={theme.colors.muted}
          align="center"
          style={{ marginTop: 20, maxWidth: 320 }}
        >
          {t("welcome.pitch")}
        </Type>
      </View>
      <View
        style={{
          ...screenContentLayout,
          paddingHorizontal: 24,
          paddingBottom: 40,
          gap: 12,
        }}
      >
        <PrimaryButton
          label={t("landing.signin")}
          onPress={() => router.push("/signIn")}
        />
        <OutlinedButton
          label={t("landing.create_acc")}
          onPress={() => router.push("/register")}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
          }}
        >
          <Type variant="small" color={theme.colors.muted}>
            {t("welcome.secured")}
          </Type>
        </View>
      </View>
    </SafeAreaView>
  );
}
