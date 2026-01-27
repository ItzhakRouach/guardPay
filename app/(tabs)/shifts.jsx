import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { IconButton, useTheme } from "react-native-paper";
import AddShiftButton from "../../components/common/AddShiftButton";
import LoadingSpinner from "../../components/common/LoadingSpinnner";
import MonthPicker from "../../components/layout/MonthPicker";
import NoShiftFound from "../../components/layout/NoShiftsFound";
import MonthTotalCard from "../../components/shifts/MonthTotalCard";
import ShiftCard from "../../components/shifts/ShiftCard";
import { useAuth } from "../../hooks/auth-context";
import { useShift } from "../../hooks/useShift";
import { DATABASE_ID, databases, SHIFTS_HISTORY } from "../../lib/appwrite";
import { formatShiftDate, formatShiftTime } from "../../lib/utils";

export default function ShiftsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user } = useAuth();
  const { shifts, loading, setShifts } = useShift(user, currentDate);

  const theme = useTheme();
  const styles = makeStyle(theme);
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const router = useRouter();

  // function that run only when data change (shift added ) and calculate total hours and amount the user earn
  const monthTotals = useMemo(() => {
    return shifts.reduce(
      (acc, shift) => {
        acc.amount += Number(shift.total_amount || 0);
        acc.hours +=
          Number(shift.reg_hours || 0) + Number(shift.extra_hours || 0);
        return acc;
      },
      { amount: 0, hours: 0 },
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
      <MonthTotalCard
        totalAmount={monthTotals.amount}
        totalHours={monthTotals.hours}
      />

      {loading ? (
        <LoadingSpinner />
      ) : shifts?.length === 0 ? (
        <NoShiftFound monthName={monthName} />
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
                  shift.start_time,
                )} - ${formatShiftTime(shift.end_time)}`}
                totalAmout={shift.total_amount}
              />
            </Swipeable>
          ))}
        </ScrollView>
      )}
      <AddShiftButton />
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
    scrollContent: { padding: 10, paddingHorizontal: 0 },
  });
