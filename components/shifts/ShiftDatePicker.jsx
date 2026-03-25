import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Surface, Text, TextInput, useTheme } from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";

export default function ShiftDatePicker({
  startTime,
  date,
  openPicker,
  endTime,
  hourRate, // ערך ה-State (יכול להיות מחרוזת ריקה)
  setHourRate, // פונקציית העדכון
  defaultRate, // תעריף ברירת המחדל מהפרופיל (למשל 52)
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
              outlineStyle={styles.outline}
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
                left={isRTL ? <TextInput.Icon icon="clock-start" /> : null}
                right={!isRTL ? <TextInput.Icon icon="clock-start" /> : null}
                style={styles.timeInput}
                outlineStyle={styles.outline}
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
                left={isRTL ? <TextInput.Icon icon="clock-end" /> : null}
                right={!isRTL ? <TextInput.Icon icon="clock-end" /> : null}
                style={styles.timeInput}
                outlineStyle={styles.outline}
              />
              <Text style={styles.label}>{t("add_shift.end_t")}</Text>
            </View>
          </Pressable>
        </View>

        {/** Hour Rate Section - התיקון כאן */}
        <View style={{ marginTop: 15 }}>
          <View>
            <TextInput
              mode="outlined"
              // מציג את מה שהמשתמש הקליד. אם ריק - מציג ריק (ואז ה-Placeholder מופיע)
              value={hourRate === "" ? "" : String(hourRate)}
              // מציג את תעריף ברירת המחדל כרמז ויזואלי
              placeholder={String(defaultRate || "0")}
              placeholderTextColor={theme.colors.outline}
              keyboardType="decimal-pad"
              onChangeText={(val) => {
                // מאפשר רק מספרים ונקודה עשרונית אחת
                const filtered = val.replace(/[^0-9.]/g, "");
                setHourRate(filtered);
              }}
              contentStyle={{
                textAlign: isRTL ? "right" : "left",
              }}
              style={styles.input}
              outlineStyle={styles.outline}
              left={<TextInput.Icon icon="cash-multiple" />}
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
      borderRadius: 20,
      padding: 5,
      marginTop: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    formContentWrapper: {
      padding: 10,
    },
    input: {
      backgroundColor: theme.colors.surface,
      height: 56,
      marginBottom: 5,
    },
    timeInput: {
      backgroundColor: theme.colors.surface,
      textAlign: "center",
    },
    timeRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "space-between", // תיקון שגיאת כתיב
      marginTop: 15,
      gap: 10, // ריווח בין שעת התחלה לסיום
    },
    flex1: {
      flex: 1,
    },
    outline: {
      borderRadius: 12,
    },
    label: {
      position: "absolute",
      top: -8,
      left: isRTL ? undefined : 15,
      right: isRTL ? 15 : undefined,
      backgroundColor: theme.colors.surface, // שינוי ל-surface כדי שלא יהיה "חור" בצבע אחר
      paddingHorizontal: 6,
      fontSize: 12,
      fontWeight: "bold",
      color: theme.colors.primary,
      zIndex: 1,
    },
  });
