import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Surface, Text, TextInput, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";

export default function ShiftDatePicker({
  startTime,
  date,
  openPicker,
  endTime,
  hourRate,
  setHourRate,
}) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const styles = makeStyle(theme, isRTL);
  const { t } = useTranslation();

  return (
    <Surface style={styles.formCard} elevation={1}>
      <View style={styles.formContentWrapper}>
        {/** Date Section */}
        <Pressable onPress={() => openPicker("date", "date")}>
          <View pointerEvents="none">
            <TextInput
              value={date.toLocaleDateString("en-GB")}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="calendar-range" />}
            />
            <Text style={styles.label}>{t("add_shift.work_d")}</Text>
          </View>
        </Pressable>

        {/** Time Section */}
        <View style={styles.timeRow}>
          <Pressable
            style={styles.flex1}
            onPress={() => openPicker("time", "start")}
          >
            <View pointerEvents="none">
              <TextInput
                value={startTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                mode="outlined"
                contentStyle={{ textAlign: isRTL ? "right" : "left" }}
                left={isRTL ? <TextInput.Icon icon="clock-start" /> : ""}
                right={isRTL ? "" : <TextInput.Icon icon="clock-start" />}
                style={{
                  textAlign: "center",
                  backgroundColor: theme.colors.card,
                }}
              />
              <Text style={styles.label}>{t("add_shift.start_t")}</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.flex1}
            onPress={() => openPicker("time", "end")}
          >
            <View pointerEvents="none">
              <TextInput
                value={endTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                mode="outlined"
                contentStyle={{ textAlign: isRTL ? "right" : "left" }}
                right={isRTL ? "" : <TextInput.Icon icon="clock-end" />}
                left={isRTL ? <TextInput.Icon icon="clock-end" /> : ""}
                style={{
                  textAlign: "center",
                  backgroundColor: theme.colors.card,
                }}
              />
              <Text style={styles.label}>{t("add_shift.end_t")}</Text>
            </View>
          </Pressable>
        </View>

        <View style={{ marginTop: 10 }}>
          <View>
            <TextInput
              mode="outlined"
              value={String(hourRate)}
              placeholder={String(hourRate)}
              keyboardType="decimal-pad"
              onChangeText={(val) => setHourRate(val)}
              contentStyle={{
                writingDirection: "rtl",
                textAlign: isRTL ? "right" : "left",
              }}
              style={[styles.input, { marginBottom: 10 }]}
            />
            <Text style={styles.label}>{t("add_shift.rate_per_hour")}</Text>
          </View>
        </View>
      </View>
    </Surface>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 10,
      marginTop: 20,
      marginBottom: 20,
    },
    formContentWrapper: {
      borderRadius: 16,
      overflow: "hidden",
      padding: 10,
    },
    input: {
      backgroundColor: theme.colors.surface,
      height: 60,
    },
    timeRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "spcae-between",
      marginTop: 8,
      gap: 2,
    },
    flex1: {
      flex: 1,
    },
    label: {
      position: "absolute",
      top: -5,
      right: isRTL ? 12 : "",
      left: isRTL ? "" : 12,
      backgroundColor: theme.colors.card,
      paddingHorizontal: 5,
      fontSize: 12,
      color: theme.colors.primary,
    },
  });
