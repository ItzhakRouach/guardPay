import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Text,
  useTheme,
} from "react-native-paper";
import {
  client,
  DATABASE_ID,
  databases,
  USERS_PREFS,
} from "../../lib/appwrite";
import { useAuth } from "../../lib/auth-context";
import { initalName } from "../../lib/utils";
import ProfileSummary from "../components/layout/ProfileSummary";

export default function Index() {
  // use the allready defined functions and states
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  const theme = useTheme();
  const styles = makeStyle(theme);

  const fetchUserProfile = useCallback(async (user) => {
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
  }, []);

  // fetch user info
  useEffect(() => {
    fetchUserProfile(user);
    const channel = `databases.${DATABASE_ID}.collections.${USERS_PREFS}.documents`;
    const unsubcribe = client.subscribe(channel, (response) => {
      const isUpdate = response.events.some((e) => e.includes(".update"));
      const isMyDoc = response.payload.user_id === user?.$id;
      if (isMyDoc || isUpdate) {
        fetchUserProfile(user);
      }
    });
    return () => unsubcribe();
  }, [user, fetchUserProfile]);

  const AvatarName = () => (
    <Avatar.Text size={100} label={initalName(profile?.user_name)} />
  );

  const handleEditBtn = () => {
    router.push("/edit-profile");
  };

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
      <Button
        icon="account-edit"
        textColor={theme.colors.primary}
        style={styles.editBtn}
        onPress={() => handleEditBtn()}
      >
        Edit
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
            <ProfileSummary profile={profile} user={user} />
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
    editBtn: {
      position: "absolute",
      top: 50,
      left: 10,
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
  });
