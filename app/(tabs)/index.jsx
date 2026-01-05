import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Divider,
  List,
  Text,
  useTheme,
} from "react-native-paper";
import { DATABASE_ID, databases, USERS_PREFS } from "../../lib/appwrite";
import { useAuth } from "../../lib/auth-context";
import { formatDates, initalName } from "../../lib/utils";

export default function Index() {
  // use the allready defined functions and states
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const theme = useTheme();
  const styles = makeStyle(theme);

  const fetchUserProfile = async (user) => {
    if (!user) return;
    try {
      const response = await databases.listDocuments(DATABASE_ID, USERS_PREFS, [
        Query.equal("user_id", user.$id),
      ]);
      if (response.documents.length > 0) {
        setProfile(response.documents[0]);
        setLoading(false);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.log(err);
      setProfile(null);
    }
  };

  // fetch user info
  useEffect(() => {
    fetchUserProfile(user);
  }, [user]);

  const AvatarName = () => (
    <Avatar.Text size={100} label={initalName(profile?.user_name)} />
  );

  return (
    <View style={styles.container}>
      <Button
        icon="logout"
        textColor={theme.colors.primary}
        onPress={signOut}
        style={styles.btn}
      >
        Sign out
      </Button>
      {loading ? (
        <ActivityIndicator style={styles.loadingProfile} size="large" />
      ) : (
        <>
          <View style={styles.headerWrapper}>
            <AvatarName />
            <Text variant="headlineLarge" style={styles.userName}>
              {profile.user_name}
            </Text>
          </View>
          <ScrollView showsHorizontalScrollIndicator={false}>
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
                left={(props) => (
                  <List.Icon {...props} icon="account-outline" />
                )}
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
          </ScrollView>
        </>
      )}
    </View>
  );
}

// styles for the entier screen
const makeStyle = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.background,
    },

    btn: {
      position: "absolute",
      top: 50,
      right: 10,
    },
    loadingProfile: {
      alignSelf: "center",
      marginTop: "auto",
      marginBottom: "auto",
    },
    headerWrapper: {
      alignItems: "center",
      marginTop: 100,
      marginBottom: 20,
    },
    userName: {
      color: theme.colors.primary,
      fontWeight: 500,
      letterSpacing: -1,
      marginTop: 15,
    },
    contentWrapper: {
      width: "100%",
      padding: 10,
      marginTop: 10,
    },
    listItem: {
      marginBottom: 15,
    },
  });
