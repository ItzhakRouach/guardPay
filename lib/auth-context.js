import { createContext, useContext, useEffect, useState } from "react";
import { ID, Query } from "react-native-appwrite";
import { account, DATABASE_ID, databases, USERS_PREFS } from "./appwrite";

// initilize authcontext to be able to use accross the app to make sure the user is auth

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [profile, setProfile] = useState(true);
  const [loading, setLoading] = useState(true);

  //funtion to fetch user and if successed also fetch  his profile / prefs
  const getUser = async () => {
    try {
      const session = await account.get();
      setUser(session);
      if (session) {
        await fetchUserProfile(session);
      }
    } catch (err) {
      console.log(err);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  //function to fecth user prefs
  const fetchUserProfile = async (user) => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, USERS_PREFS, [
        Query.equal("user_id", user.$id),
      ]);
      if (response.documents.length > 0) {
        setProfile(response.documents[0]);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.log(err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // function to handle users Sign In the app
  const signIn = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const session = await account.get();
      //if successed
      setUser(session);
      await fetchUserProfile(session);
      return null;
    } catch (err) {
      console.log(err);
    }
  };

  // function to handle users sign up the app
  const signUp = async (email, password) => {
    try {
      //create the new account
      await account.create(ID.unique(), email, password);
      //if created then signin the new user
      await signIn(email, password);
      return null;
    } catch (err) {
      console.log(err);
      return err || "Error occured during Sign Up";
    }
  };

  //function to handle users sign out the app
  const signOut = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.log(err);
    }
  };

  //when the app open try to fetch the user.
  useEffect(() => {
    getUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoadingUser,
        user,
        signIn,
        signOut,
        signUp,
        profile,
        fetchUserProfile,
        setIsLoadingUser,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be inside of AuthProvider.");
  }
  return context;
}
