import { StyleSheet } from "react-native";
import { Divider, List, Surface, Text, useTheme } from "react-native-paper";
import { formatDates } from "../../../lib/utils";

export default function ProfileSummary({
  profile,
  user,
  signout,
  handleEditBtn,
}) {
  const theme = useTheme();
  const styles = makeStyle(theme);
  return (
    <>
      <Surface style={styles.contentWrapper} elevation={1}>
        <Text style={styles.title} variant="headlineMedium">
          General
        </Text>
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => <List.Icon {...props} icon="email" />}
          title={`Email: ${user.email}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => <List.Icon {...props} icon="account-outline" />}
          title={`Name: ${profile.user_name}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => <List.Icon {...props} icon="numeric" />}
          title={`Age: ${profile.age}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => (
            <List.Icon {...props} icon="calendar-account-outline" />
          )}
          title={`Birth Date: ${formatDates(profile.birth_date)}`}
        />
      </Surface>
      {/**Preferences Section */}
      <Surface
        style={[styles.contentWrapper, styles.preferences]}
        elevation={1}
      >
        <Text style={styles.title} variant="headlineMedium">
          Preferences
        </Text>

        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => <List.Icon {...props} icon="cash-clock" />}
          title={`Hour Rate: ${profile.price_per_hour}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => <List.Icon {...props} icon="cash-fast" />}
          title={`Ride Rate: ${profile.price_per_ride}`}
        />
        <Divider style={styles.dividerStyle} bold={true} />
      </Surface>
      {/**Account Section */}
      <Surface
        style={[styles.contentWrapper, styles.preferences]}
        elevation={1}
      >
        <Text style={styles.title} variant="headlineMedium">
          Account
        </Text>
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => (
            <List.Icon
              {...props}
              icon="account-edit"
              color={theme.colors.primary}
            />
          )}
          title={"Edit Preferences"}
          onPress={() => handleEditBtn()}
        />
        <Divider style={styles.dividerStyle} bold={true} />
        <List.Item
          style={styles.listItem}
          titleStyle={{ fontSize: 20 }}
          left={(props) => (
            <List.Icon {...props} icon="logout" color="#E94560" />
          )}
          title={"Log Out"}
          onPress={signout}
        />
      </Surface>
    </>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    contentWrapper: {
      padding: 15,
      marginTop: 5,
      borderRadius: 30,
      backgroundColor: theme.colors.surface,
      marginHorizontal: 10,
    },
    title: {
      marginBottom: 10,
      textAlign: "left",
      fontWeight: "500",
      letterSpacing: -1,
      color: theme.colors.profileSection,
    },
    dividerStyle: {
      color: theme.colors.divider,
    },

    listItem: {
      marginBottom: 2,
    },
    preferences: {
      marginTop: 20,
    },
  });
