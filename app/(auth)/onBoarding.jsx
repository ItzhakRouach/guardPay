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
          icon_transparent.png has a thin horizontal edge artifact above
          the shield (left over from the design export). Clip it off
          by rendering the Image taller than the container and nudging
          it up — the shield's tip stays comfortably inside the clip
          while the stray line lands outside.
        */}
        <View
          style={{
            width: 140,
            height: 130,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <Image
            source={require("../../assets/images/icon_transparent.png")}
            style={{ width: 140, height: 144, marginTop: -14 }}
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
