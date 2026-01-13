import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useLanguage } from "../../../lib/lang-context";

export default function NoShiftFound({ monthName }) {
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const styles = makeStyle(theme);
  const { t } = useTranslation();

  return (
    <View style={styles.noShifts}>
      <Text
        variant="headlineSmall"
        style={{
          letterSpacing: -1,
          fontWeight: 500,
          color: theme.colors.primary,
          paddingStart: 10,
        }}
      >
        {`${t(`no_shifts.text`)} ${t(`month.${monthName}`)}`}
      </Text>
    </View>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    noShifts: {
      justifyContent: "center",
      alignItems: "center",
      marginTop: "auto",
      marginBottom: "auto",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
  });
