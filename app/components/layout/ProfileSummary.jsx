import { StyleSheet, View } from "react-native";
import { Divider, List, useTheme } from "react-native-paper";
import { formatDates } from "../../../lib/utils";

export default function ProfileSummary({ profile, user }) {
  const theme = useTheme();
  const styles = makeStyle(theme);
  return (
    <View style={styles.contentWrapper}>
      <List.Item
        style={styles.listItem}
        titleStyle={{ fontSize: 20 }}
        left={(props) => <List.Icon {...props} icon="email" />}
        title={`Email: ${user.email}`}
      />
      <Divider />
      <List.Item
        style={styles.listItem}
        titleStyle={{ fontSize: 20 }}
        left={(props) => <List.Icon {...props} icon="account-outline" />}
        title={`Name: ${profile.user_name}`}
      />
      <Divider />
      <List.Item
        style={styles.listItem}
        titleStyle={{ fontSize: 20 }}
        left={(props) => <List.Icon {...props} icon="numeric" />}
        title={`Age: ${profile.age}`}
      />
      <Divider />
      <List.Item
        style={styles.listItem}
        titleStyle={{ fontSize: 20 }}
        left={(props) => (
          <List.Icon {...props} icon="calendar-account-outline" />
        )}
        title={`Birth Date: ${formatDates(profile.birth_date)}`}
      />
      <Divider />
      <List.Item
        style={styles.listItem}
        titleStyle={{ fontSize: 20 }}
        left={(props) => <List.Icon {...props} icon="cash-clock" />}
        title={`Hour Rate: ${profile.price_per_hour}`}
      />
      <Divider />
      <List.Item
        style={styles.listItem}
        titleStyle={{ fontSize: 20 }}
        left={(props) => <List.Icon {...props} icon="cash-fast" />}
        title={`Ride Rate: ${profile.price_per_ride}`}
      />
      <Divider />
    </View>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    contentWrapper: {
      width: "100%",
      padding: 10,
      marginTop: 10,
    },

    listItem: {
      marginBottom: 15,
    },
  });
