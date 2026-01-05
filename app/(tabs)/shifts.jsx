import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import {
  ActivityIndicator,
  Divider,
  IconButton,
  Surface,
  Text,
} from "react-native-paper";
import { DATABASE_ID, databases, SHIFTS_HISTORY } from "../../lib/appwrite";
import { useAuth } from "../../lib/auth-context";
import { formatShiftDate, formatShiftTime } from "../../lib/utils";
import ShiftCard from "../components/ShiftCard";

export default function ShiftsScreen() {
  const [shifts, setShifts] = useState(["one"]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Logic to change months
  const changeMonth = (offset) => {
    const newDate = new Date(
      currentDate.setMonth(currentDate.getMonth() + offset)
    );
    setCurrentDate(new Date(newDate));
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const yearName = currentDate.getFullYear();

  // run each time the month is changed , to fetch the shifs from that month
  const fetchShifts = async () => {
    if (!user) return;
    try {
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString();
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
        23,
        59,
        59
      ).toISOString();

      const response = await databases.listDocuments(
        DATABASE_ID,
        SHIFTS_HISTORY,
        [
          Query.equal("user_id", user.$id),
          Query.between("start_time", startOfMonth, endOfMonth),
          Query.orderAsc("start_time"),
        ]
      );
      setShifts(response.documents || []);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setShifts([]);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [currentDate, user?.$id]);

  // function that run only when data change (shift added ) and calculate total hours and amount the user earn
  const monthTotals = useMemo(() => {
    return shifts.reduce(
      (acc, shift) => {
        acc.amount += Number(shift.total_amount || 0);
        acc.hours +=
          Number(shift.reg_hours || 0) + Number(shift.extra_houes || 0);
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
          backgroundColor: "#ef4444",
          justifyContent: "center",
          alignItems: "center",
          width: 80,
          borderRadius: 12,
          marginVertical: 15,
          marginLeft: 16,
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
          backgroundColor: "#3b82f6",
          justifyContent: "center",
          width: 70,
          borderRadius: 12,
          marginVertical: 15,
          marginRight: 16,
        }}
        onPress={onEdit}
      />
    </View>
  );

  const handleDelete = async (shiftId) => {
    try {
      await databases.deleteDocument(DATABASE_ID, SHIFTS_HISTORY, shiftId);
      // refresh current shift list
      setShifts((prev) => prev.filter((s) => s.$id !== shiftId));
    } catch (err) {
      console.log(err);
    }
  };

  const handleEdit = (shift) => {
    router.push({
      pathname: "/add-shift",
      params: { shiftId: shift.$id, existingData: JSON.stringify(shift) },
    });
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <IconButton icon="chevron-left" onPress={() => changeMonth(-1)} />
        <View style={styles.dateInfo}>
          <Text variant="titleLarge" style={styles.monthText}>
            {monthName}
          </Text>
          <Text variant="bodySmall">{yearName}</Text>
        </View>
        <IconButton icon="chevron-right" onPress={() => changeMonth(+1)} />
      </Surface>

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
            style={{ letterSpacing: -1, fontWeight: 500, color: "#213448" }}
          >
            No shifts added for {monthName}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
        iconColor="#213448"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 10,
  },
  btn: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "white",
    marginTop: 40,
    borderRadius: 20,
  },
  content: {
    justifyContent: "center",
    textAlign: "center",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: "auto",
  },
  dateInfo: {
    alignItems: "center",
  },
  monthText: { fontWeight: "bold", color: "#213448" },
  scrollContent: { padding: 16 },

  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    textAlign: "left",
  },
  cardShift: {
    backgroundColor: "#fff",
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
    backgroundColor: "#213448", // Dark theme for contrast
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
    color: "#94A3B8", // Light gray/blue
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    color: "#FFFFFF", // White text stands out on dark background
    fontWeight: "bold",
    textAlign: "center",
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)", // Semi-transparent white
  },
});
