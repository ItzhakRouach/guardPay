import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { createContext, useContext, useEffect, useState } from "react";
import { ID, Query } from "react-native-appwrite";
import {
  account,
  DATABASE_ID,
  databases,
  functions,
  USERS_PREFS,
} from "../lib/appwrite";

WebBrowser.maybeCompleteAuthSession();

// initilize authcontext to be able to use accross the app to make sure the user is auth

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [profile, setProfile] = useState(null);

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
  const fetchUserProfile = async (currentUser) => {
    if (!currentUser) return;
    try {
      const response = await databases.listDocuments(DATABASE_ID, USERS_PREFS, [
        Query.equal("user_id", currentUser.$id),
      ]);
      if (response.documents.length > 0) {
        setProfile(response.documents[0]);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.log(err);
      setProfile(null);
    }
  };

  // sign in using google
  const signInWithGoogle = async () => {
    try {
      const deepLink = new URL(makeRedirectUri({ preferLocalhost: true }));
      const scheme = `${deepLink.protocol}//`; // e.g. 'exp://' or 'appwrite-callback-<PROJECT_ID>://'

      // Start OAuth flow
      const loginUrl = await account.createOAuth2Token(
        "google",
        `${deepLink}`,
        `${deepLink}`,
      );

      // Open loginUrl and listen for the scheme redirect
      const result = await WebBrowser.openAuthSessionAsync(
        `${loginUrl}`,
        scheme,
      );
      if (result.type === "success" && result.url) {
        // Extract credentials from OAuth redirect URL
        const url = new URL(result.url);
        const secret = url.searchParams.get("secret");
        const userId = url.searchParams.get("userId");

        // Create session with OAuth credentials
        await account.createSession(userId, secret);
        await getUser();
        return true;
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      return false;
    }
  };

  const signInWithApple = async () => {
    try {
      // 1. Native FaceID / TouchID Prompt
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // 2. Send the Identity Token to your Backend Function
      // Replace 'apple-auth' with your actual Function ID
      const execution = await functions.createExecution(
        "697d1855002cf9854228",
        JSON.stringify({
          code: credential.authorizationCode,
          email: credential.email, // Only exists on FIRST login
          fullName: credential.fullName, // Only exists on FIRST login
        }),
      );

      // 3. Handle the response from your function
      const response = JSON.parse(execution.responseBody);

      if (response.error) {
        throw new Error(response.error);
      }

      // 4. Log in using the short "secret" the function created
      await account.createSession(
        response.userId,
        response.secret, // This is a valid Appwrite secret
      );
      await getUser();
      console.log("Logged in natively!");
      return true;
    } catch (e) {
      console.error(e);
    }
  };

  // function to handle users Sign In the app
  const signIn = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      await getUser();
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
      // מנסים למחוק מהשרת
      await account.deleteSession("current");
      console.log("Session deleted from server");
      setUser(null);
      setProfile(null);
      router.replace("/(auth)/onBoarding");
    } catch (error) {
      console.log("User already signed out or session expired:", error.message);
      setUser(null);
      setProfile(null);
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
        signInWithGoogle,
        signInWithApple,
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
