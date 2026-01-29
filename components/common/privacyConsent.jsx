import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, Text } from "react-native";
import { useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";

export const PrivacyConsent = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const theme = useTheme();
  const styles = makeStyle(theme, isRTL);

  return (
    <Text style={styles.baseText}>
      {t("common.privacy_aggrement")}
      {"\n"}
      <Text
        style={styles.linkText}
        onPress={() =>
          Linking.openURL(
            "https://gistcdn.githack.com/ItzhakRouach/8544fa6efc006e2b1275e6921edf098a/raw/policy.html",
          )
        }
      >
        {t("common.privacy")}
      </Text>
      .
    </Text>
  );
};

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    baseText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      writingDirection: isRTL ? "rtl" : "ltr",
      marginTop: 20,
      paddingHorizontal: 20,
    },
    linkText: {
      color: theme.colors.primary, // Standard iOS Blue
      fontWeight: "600",
      textDecorationLine: "underline",
    },
  });
