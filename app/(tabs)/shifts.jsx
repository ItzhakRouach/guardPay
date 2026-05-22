import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { IconButton, useTheme } from "react-native-paper";
import { Query } from "react-native-appwrite";
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
import { restreakSickUpdates } from "../../utils/sickDays";

export default function ShiftsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user, profile } = useAuth();
  const { shifts, loading, setShifts } = useShift(user, currentDate);

  const theme = useTheme();
  const styles = makeStyle(theme);
  const monthName = currentDate.getMonth();
  const router = useRouter();
  const { t } = useTranslation();

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

  // After a sick doc is deleted, the surrounding sick docs in the same
  // streak need their positions (and therefore sick_percent/total_amount)
  // recomputed. Queries ALL of the user's remaining sick docs, runs them
  // through the diff helper, and only writes the ones that actually need
  // an update. Streaks in other months keep their values unchanged.
  const restreakAfterSickDelete = async () => {
    const dailyPay = (Number(profile?.price_per_hour) || 0) * 8;
    if (dailyPay <= 0) return;
    const res = await databases.listDocuments(DATABASE_ID, SHIFTS_HISTORY, [
      Query.equal("user_id", user.$id),
      Query.equal("is_sick", true),
      Query.limit(500),
    ]);
    const updates = restreakSickUpdates(res.documents, dailyPay);
    await Promise.all(
      updates.map((u) =>
        databases.updateDocument(DATABASE_ID, SHIFTS_HISTORY, u.$id, {
          sick_percent: u.sick_percent,
          total_amount: u.total_amount,
        }),
      ),
    );
    // Reflect updates in the visible month's shift list immediately.
    setShifts((prev) =>
      prev.map((s) => {
        const u = updates.find((x) => x.$id === s.$id);
        return u ? { ...s, sick_percent: u.sick_percent, total_amount: u.total_amount } : s;
      }),
    );
  };

  // Actual destructive delete, called only after the user confirms.
  const performDelete = async (shiftId) => {
    try {
      const doc = shifts.find((s) => s.$id === shiftId);
      await databases.deleteDocument(DATABASE_ID, SHIFTS_HISTORY, shiftId);
      // refresh current shift list
      setShifts((prev) => prev.filter((s) => s.$id !== shiftId));
      if (doc?.is_sick) {
        await restreakAfterSickDelete();
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Swipe-to-delete entry point — guard with a confirm so a stray
  // swipe-and-tap can't silently wipe a shift the user just spent
  // minutes logging.
  const handleDelete = (shiftId) => {
    Alert.alert(
      t("shifts.delete_confirm_title"),
      t("shifts.delete_confirm_body"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => performDelete(shiftId),
        },
      ],
    );
  };
  // handle the edit functionality
  const handleEdit = (shift) => {
    // Editing a sick day in the standard add-shift form would clobber
    // its date-range / streak-percent contract. Until a dedicated sick
    // edit flow exists, force the user to delete + re-create instead.
    if (shift.is_sick) {
      Alert.alert(
        t("shifts.sick_edit_blocked_title"),
        t("shifts.sick_edit_blocked_body"),
      );
      return;
    }
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
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/shift-details",
                    params: { shiftData: JSON.stringify(shift) },
                  });
                }}
              >
                <ShiftCard
                  dateTime={formatShiftDate(shift.start_time)}
                  dateHours={`${formatShiftTime(
                    shift.start_time,
                  )} - ${formatShiftTime(shift.end_time)}`}
                  totalAmout={shift.total_amount}
                  shift={shift}
                  userColors={profile?.shift_colors}
                />
              </TouchableOpacity>
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
      paddingVertical: 50,
      paddingHorizontal: 10,
    },
    scrollContent: {
      padding: 10,
      paddingHorizontal: 0,
    },
  });
