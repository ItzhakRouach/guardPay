import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import {
  ActivityIndicator,
  Card,
  Divider,
  IconButton,
  Surface,
  Text,
} from "react-native-paper";
import { DATABASE_ID, databases, SHIFTS_HISTORY } from "../../lib/appwrite";
import { useAuth } from "../../lib/auth-context";
import { ShiftCard } from "../components/ShiftCard";

export default function ShiftsScreen() {
  const [shifts, setShifts] = useState(["one"]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

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

  /*useEffect(() => {
    fetchShifts();
  }, [currentDate, user?.$id]);*/

  return (
    <View style={styles.container}>
      <IconButton
        style={styles.btn}
        icon="plus"
        size={30}
        iconColor="#213448"
        onPress={() => console.log("got pressed")}
      />
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
          <Card style={styles.cardShift}>
            <Card.Content>
              <View style={styles.cardDetails}>
                <View style={styles.shiftAmount}>
                  <Text variant="labelLarge">Amount</Text>
                  <Text variant="headlineSmall">660₪</Text>
                </View>
                <Divider />
                <View style={styles.shiftDate}>
                  <Text variant="labelLarge">01/01/2026</Text>
                  <Text variant="labelMedium">15:00 - 23:00</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
          <ShiftCard
            dateTime={"02/01/2026"}
            dateHours={"23:00 - 07:00"}
            totalAmout={400}
          />
        </ScrollView>
      )}
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
