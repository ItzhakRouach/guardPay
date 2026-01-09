import { Pressable, StyleSheet, View } from "react-native";
import { Surface, TextInput, useTheme } from "react-native-paper";

export default function ShiftDatePicker({
  startTime,
  date,
  openPicker,
  endTime,
  price_per_hour,
  price_per_ride,
  setRates,
}) {
  const theme = useTheme();
  const styles = makeStyle(theme);

  return (
    <Surface style={styles.formCard} elevation={1}>
      <View style={styles.formContentWrapper}>
        {/** Date Section */}
        <Pressable onPress={() => openPicker("date", "date")}>
          <View pointerEvents="none">
            <TextInput
              label="Work Date"
              value={date.toLocaleDateString("en-GB")}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="calendar-range" />}
            />
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
                label="Start Time"
                value={startTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                mode="outlined"
                left={<TextInput.Icon icon="clock-start" />}
                style={{
                  textAlign: "center",
                  backgroundColor: theme.colors.card,
                }}
              />
            </View>
          </Pressable>

          <View style={styles.arrowIcon}>
            <TextInput.Icon icon="arrow-right" />
          </View>

          <Pressable
            style={styles.flex1}
            onPress={() => openPicker("time", "end")}
          >
            <View pointerEvents="none">
              <TextInput
                label="End Time"
                value={endTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                mode="outlined"
                right={<TextInput.Icon icon="clock-end" />}
                style={{
                  textAlign: "center",
                  backgroundColor: theme.colors.card,
                }}
              />
            </View>
          </Pressable>
        </View>

        <View style={{ marginTop: 10 }}>
          <View>
            <TextInput
              mode="outlined"
              value={String(price_per_hour)}
              placeholder={String(price_per_hour)}
              label="Rate Per Hour"
              keyboardType="decimal-pad"
              onChangeText={(val) =>
                setRates((prev) => ({
                  ...prev,
                  price_per_hour: val,
                }))
              }
              style={[styles.input, { marginBottom: 10 }]}
            />

            <TextInput
              mode="outlined"
              value={String(price_per_ride)}
              placeholder={String(price_per_ride)}
              keyboardType="decimal-pad"
              label="Rate Per Ride"
              onChangeText={(val) =>
                setRates((prev) => ({
                  ...prev,
                  price_per_ride: val,
                }))
              }
              style={styles.input}
            />
          </View>
        </View>
      </View>
    </Surface>
  );
}

const makeStyle = (theme) =>
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "spcae-between",
      marginTop: 8,
      gap: 2,
    },
    flex1: {
      flex: 1,
    },
  });
