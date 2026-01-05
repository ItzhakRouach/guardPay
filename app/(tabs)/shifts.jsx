import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import {
  ActivityIndicator,
  IconButton,
  Surface,
  Text,
} from "react-native-paper";
import { DATABASE_ID, databases, SHIFTS_HISTORY } from "../../lib/appwrite";
import { useAuth } from "../../lib/auth-context";
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

  // function to format the shift date
  const formatShiftDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // Outputs: DD/MM/YYYY
  };

  //function to format the  shift time
  const formatShiftTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
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
            No shifts added yet, please add one
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/** Card to present shift with date , hours , and total money made this day */}
          {shifts.map((shift) => (
            <ShiftCard
              dateTime={formatShiftDate(shift.start_time)}
              dateHours={`${formatShiftTime(
                shift.start_time
              )} - ${formatShiftTime(shift.end_time)}`}
              totalAmout={shift.total_amount}
              key={shift.$id}
            />
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
  verticalDivider: {
    width: 1,
    height: 40,
  },
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
});
