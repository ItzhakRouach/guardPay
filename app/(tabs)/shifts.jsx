import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import {
  ActivityIndicator,
  Divider,
  IconButton,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { DATABASE_ID, databases, SHIFTS_HISTORY } from "../../lib/appwrite";
import { useAuth } from "../../lib/auth-context";
import { useShift } from "../../lib/useShift";
import { formatShiftDate, formatShiftTime } from "../../lib/utils";
import MonthPicker from "../components/MonthPicker";
import ShiftCard from "../components/ShiftCard";

export default function ShiftsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user } = useAuth();
  const router = useRouter();
  const { shifts, loading, setShifts } = useShift(user, currentDate);

  const theme = useTheme();
  const styles = makeStyle(theme);
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // function that run only when data change (shift added ) and calculate total hours and amount the user earn
  const monthTotals = useMemo(() => {
    return shifts.reduce(
      (acc, shift) => {
        acc.amount += Number(shift.total_amount || 0);
        acc.hours +=
          Number(shift.reg_hours || 0) + Number(shift.extra_hours || 0);
        return acc;
      },
      { amount: 0, hours: 0 }
    );
  }, [shifts]);

  // handle Delete action (Sliding to the right)
  const renderRightAction = (onDelete) => (
    <View style={styles.deleteAction}>
      <IconButton
        icon="delete"
        iconColor="white"
        size={40}
        style={{
          backgroundColor: theme.colors.delBtn,
          justifyContent: "center",
          alignItems: "center",
          width: 70,
          borderRadius: 12,
          marginVertical: 15,
        }}
        onPress={onDelete}
      />
    </View>
  );
  // handle Edit Action (sliding to the left)
  const renderLeftAction = (onEdit) => (
    <View style={styles.editAction}>
      <IconButton
        icon="pencil"
        iconColor="white"
        size={40}
        style={{
          backgroundColor: theme.colors.editBtn,
          justifyContent: "center",
          width: 70,
          borderRadius: 12,
          marginVertical: 15,
        }}
        onPress={onEdit}
      />
    </View>
  );

  // handle the delete functionality
  const handleDelete = async (shiftId) => {
    try {
      await databases.deleteDocument(DATABASE_ID, SHIFTS_HISTORY, shiftId);
      // refresh current shift list
      setShifts((prev) => prev.filter((s) => s.$id !== shiftId));
    } catch (err) {
      console.log(err);
    }
  };
  // handle the edit functionality
  const handleEdit = (shift) => {
    router.push({
      pathname: "/add-shift",
      params: { shiftId: shift.$id, existingData: JSON.stringify(shift) },
    });
  };

  return (
    <View style={styles.container}>
      <MonthPicker currentDate={currentDate} setCurrentDate={setCurrentDate} />

      {/** Month summary Section */}
      <Surface style={styles.summaryBar} elevation={1}>
        <View>
          <Text variant="labelMedium" style={styles.summaryLabel}>
            MONTHLY PAY
          </Text>
          <Text variant="titleLarge" style={styles.summaryValue}>
            {monthTotals.amount.toLocaleString()}₪
          </Text>
        </View>

        <Divider style={styles.verticalDivider} />
        <View>
          <Text variant="labelMedium" style={styles.summaryLabel}>
            TOTAL HOURS
          </Text>
          <Text variant="titleLarge" style={styles.summaryValue}>
            {monthTotals.hours.toFixed(1)}h
          </Text>
        </View>
      </Surface>

      {loading ? (
        <View style={styles.loadingShifts}>
          <ActivityIndicator size={60} />
        </View>
      ) : shifts?.length === 0 ? (
        <View style={styles.noShifts}>
          <Text
            variant="headlineSmall"
            style={{
              letterSpacing: -1,
              fontWeight: 500,
              color: theme.colors.primary,
            }}
          >
            No shifts added for {monthName}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 300 }]}
          showsVerticalScrollIndicator={false}
          snapToInterval={100}
          decelerationRate="fast"
        >
          {/** Card to present shift with date , hours , and total money made this day */}
          {shifts.map((shift, index) => (
            <Swipeable
              key={shift.$id || `shift-${index}`}
              renderLeftActions={() =>
                renderLeftAction(() => handleEdit(shift))
              }
              renderRightActions={() =>
                renderRightAction(() => handleDelete(shift.$id))
              }
            >
              <ShiftCard
                dateTime={formatShiftDate(shift.start_time)}
                dateHours={`${formatShiftTime(
                  shift.start_time
                )} - ${formatShiftTime(shift.end_time)}`}
                totalAmout={shift.total_amount}
              />
            </Swipeable>
          ))}
        </ScrollView>
      )}

      <IconButton
        style={styles.btn}
        icon="plus"
        size={30}
        mode="contained"
        iconColor="white"
        containerColor={theme.colors.primary}
        onPress={() => {
          try {
            router.push("/add-shift");
          } catch (err) {
            console.log(err);
          }
        }}
      />
    </View>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 10,
    },
    btn: {
      position: "absolute",
      bottom: 100,
      alignSelf: "center",
      marginRight: 23,
    },
    content: {
      justifyContent: "center",
      textAlign: "center",
      alignItems: "center",
      marginTop: "auto",
      marginBottom: "auto",
    },
    scrollContent: { padding: 10, paddingHorizontal: 0 },

    cardDetails: {
      flexDirection: "row",
      justifyContent: "space-around",
      textAlign: "left",
    },
    cardShift: {
      backgroundColor: theme.colors.onPrimary,
      borderRadius: 12,
      marginBottom: 10,
    },
    shiftAmount: {
      justifyContent: "center",
      alignItems: "center",
    },
    shiftDate: {
      textAlign: "center",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },
    noShifts: {
      justifyContent: "center",
      alignItems: "center",
      marginTop: "auto",
      marginBottom: "auto",
    },
    loadingShifts: {
      alignSelf: "center",
      marginTop: "auto",
      marginBottom: "auto",
    },
    summaryBar: {
      flexDirection: "row",
      backgroundColor: theme.colors.primary, // Dark theme for contrast
      marginHorizontal: 16,
      marginTop: 10, // Pulls it slightly closer to the header
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "space-around",
    },
    summaryItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    summaryLabel: {
      color: theme.colors.summary, // Light gray/blue
      letterSpacing: 1,
      fontWeight: 600,
      marginBottom: 4,
    },
    summaryValue: {
      color: theme.colors.surface, // White text stands out on dark background
      fontWeight: "bold",
      textAlign: "center",
    },
    verticalDivider: {
      width: 1,
      height: 30,
      backgroundColor: "rgba(255,255,255,0.2)", // Semi-transparent white
    },
  });
