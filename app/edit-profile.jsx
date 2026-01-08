import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Query } from "react-native-appwrite";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { DATABASE_ID, USERS_PREFS, databases } from "../lib/appwrite";
import { useAuth } from "../lib/auth-context";
import LoadingSpinner from "./components/LoadingSpinnner";

export default function EditProfileScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  // Initialize with empty strings to avoid .toString() crashes
  const [formData, setFormData] = useState({
    price_per_hour: "",
    price_per_ride: "",
  });

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const response = await databases.listDocuments(DATABASE_ID, USERS_PREFS, [
        Query.equal("user_id", user.$id),
      ]);

      if (response.documents.length > 0) {
        const doc = response.documents[0];
        setProfile(doc);
        // Map numbers to strings for the TextInput
        setFormData({
          price_per_hour: doc.price_per_hour?.toString() || "",
          price_per_ride: doc.price_per_ride?.toString() || "",
        });
      }
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const handleSaveBtn = async () => {
    try {
      await databases.updateDocument(DATABASE_ID, USERS_PREFS, profile.$id, {
        price_per_hour: parseFloat(formData.price_per_hour),
        price_per_ride: parseFloat(formData.price_per_ride),
      });
      setMessage("Updated Successfully");
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: theme.colors.primary }]}
        >
          Edit Profile
        </Text>
        <View style={styles.contentWrapper}>
          <TextInput
            label="Price Per Hour"
            mode="outlined"
            keyboardType="numeric"
            // Always a string, safe from 'undefined' errors
            value={formData.price_per_hour}
            onChangeText={(val) =>
              setFormData((prev) => ({ ...prev, price_per_hour: val }))
            }
            style={styles.input}
          />

          <TextInput
            label="Price Per Ride"
            mode="outlined"
            keyboardType="numeric"
            value={formData.price_per_ride}
            onChangeText={(val) =>
              setFormData((prev) => ({ ...prev, price_per_ride: val }))
            }
            style={styles.input}
          />

          {/* Added a save button for context */}
          <Button
            mode="contained"
            style={styles.saveBtn}
            onPress={() => handleSaveBtn()}
          >
            Save Changes
          </Button>
          {message && (
            <Text variant="headlineSmall" style={styles.message}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    alignSelf: "center",
    marginTop: 40,
    marginBottom: 20,
    fontWeight: "bold",
  },
  contentWrapper: {
    marginTop: 20,
  },
  input: {
    marginBottom: 15,
  },
  saveBtn: {
    marginTop: 10,
    borderRadius: 8,
  },
  message: {
    color: "green",
    textAlign: "center",
    padding: 20,
    marginTop: 10,
  },
});
