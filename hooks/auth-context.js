import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { createContext, useContext, useEffect, useState } from "react";
import { Query } from "react-native-appwrite";
import {
  account,
  client,
  DATABASE_ID,
  databases,
  functions,
  USERS_PREFS,
} from "../lib/appwrite";
import {
  classifyAppwriteError,
  isBackendUnavailable,
} from "../lib/appwriteErrors";

WebBrowser.maybeCompleteAuthSession();

// initilize authcontext to be able to use accross the app to make sure the user is auth

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [profile, setProfile] = useState(null);
  // `backendError` is set (to a kind from classifyAppwriteError) when the
  // session check failed because Appwrite was unreachable — paused project,
  // no network, 5xx. In that state `user` is deliberately left untouched so
  // the RouteGuard can show a "service unavailable" screen instead of
  // bouncing a signed-in user to onboarding.
  const [backendError, setBackendError] = useState(null);
  // `profileError` (null | error kind) means "we could not find out whether
  // a users_prefs doc exists" — distinct from `profile === null` ("we know
  // there is none"). Conflating the two used to send existing users back
  // through setupPrefs, which then created a second prefs document.
  const [profileError, setProfileError] = useState(null);

  //funtion to fetch user and if successed also fetch  his profile / prefs
  const getUser = async () => {
    try {
      const session = await account.get();
      setUser(session);
      setBackendError(null);
      if (session) {
        await fetchUserProfile(session);
      }
    } catch (err) {
      const kind = classifyAppwriteError(err);
      if (isBackendUnavailable(kind)) {
        console.log(
          `[auth] backend unavailable (${kind}) type=${err?.type} code=${err?.code}:`,
          err?.message,
        );
        setBackendError(kind);
      } else {
        // A real "no session" (401) or something we can't interpret: treat
        // as signed out, exactly as before.
        console.log(err);
        setUser(null);
        setBackendError(null);
      }
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
      setProfileError(null);
    } catch (err) {
      // Any failure here is "unknown whether a profile exists". Never
      // downgrade to `profile = null` — that is the path that creates a
      // duplicate users_prefs document.
      const kind = classifyAppwriteError(err);
      console.log(
        `[auth] profile fetch failed (${kind}) type=${err?.type} code=${err?.code}:`,
        err?.message,
      );
      setProfileError(kind);
    }
  };

  // Re-run the bootstrap after an outage. Flips the loading flag so the
  // RouteGuard shows the spinner rather than a stale error screen.
  const retry = async () => {
    setIsLoadingUser(true);
    await getUser();
  };

  // sign in using google
  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `appwrite-callback-69583540003a5151db86://google`;

      // Start OAuth flow
      const loginUrl = await account.createOAuth2Token(
        "google",
        redirectUrl,
        redirectUrl,
      );

      // Open loginUrl and listen for the scheme redirect
      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl.toString(),
        redirectUrl,
      );

      if (result.type === "success" && result.url) {
        // Extract credentials from OAuth redirect URL
        const url = new URL(result.url);
        const secret = url.searchParams.get("secret");
        const userId = url.searchParams.get("userId");

        // Create session with OAuth credentials
        await account.createSession(userId, secret);
        await getUser();
        return { ok: true };
      }
      // Browser sheet dismissed without completing OAuth.
      return { ok: false, cancelled: true };
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      return { ok: false, kind: classifyAppwriteError(error) };
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

      // 3. Handle the response from the function
      const response = JSON.parse(execution.responseBody);
      console.log(JSON.stringify(credential.fullName));

      if (response.error) {
        throw new Error(response.error);
      }

      // 4. Log in using the short "secret" the function created
      await account.createSession(
        response.userId,
        response.secret, // This is a valid Appwrite secret
      );

      if (credential.fullName && credential.fullName.givenName) {
        const userName =
          `${credential.fullName.givenName} ${credential.fullName.familyName || ""}`.trim();
        console.log(userName);
        try {
          await account.updateName(userName);
        } catch (err) {
          console.log("Name update failed!", err);
        }
      }

      await getUser();
      console.log("Logged in natively!");
      return { ok: true };
    } catch (e) {
      // User-cancelled FaceID, network failure, or the cloud function
      // returning an error all land here. Return a result object so the
      // caller can distinguish "user dismissed prompt" (say nothing) from
      // "backend unavailable" (say so) from "something else failed".
      if (e?.code === "ERR_REQUEST_CANCELED") {
        console.log("Apple Sign-In cancelled by user");
        return { ok: false, cancelled: true };
      }
      console.error("Apple Sign-In error:", e);
      return { ok: false, kind: classifyAppwriteError(e) };
    }
  };

  //function to handle users sign out the app
  const signOut = async () => {
    // Clear outage flags too, otherwise a sign-out from the
    // ServiceUnavailable screen would leave the guard stuck on it.
    const clearLocal = () => {
      setUser(null);
      setProfile(null);
      setBackendError(null);
      setProfileError(null);
    };
    try {
      // מנסים למחוק מהשרת
      await account.deleteSession("current");
      console.log("Session deleted from server");
    } catch (error) {
      console.log("User already signed out or session expired:", error.message);
    }
    clearLocal();
    // The Stack may be unmounted (ServiceUnavailable is showing); the
    // RouteGuard effect routes to onboarding on its own once `user` is
    // null, so a navigation failure here is harmless.
    try {
      router.replace("/(auth)/onBoarding");
    } catch (navErr) {
      console.log("[auth] post-signout navigation skipped:", navErr?.message);
    }
  };

  //when the app open try to fetch the user.
  useEffect(() => {
    getUser();
  }, []);

  // Keep `profile` current from realtime, applying the changed document
  // directly (no refetch). This is the single users_prefs subscription in
  // the app; the Profile screen used to run a second one and refetch.
  const userId = user?.$id;
  useEffect(() => {
    if (!userId) return undefined;
    const channel = `databases.${DATABASE_ID}.collections.${USERS_PREFS}.documents`;
    let unsubscribe = () => {};
    try {
      unsubscribe = client.subscribe(channel, (response) => {
        const doc = response?.payload;
        if (!doc || doc.user_id !== userId) return;
        const isDelete = (response.events || []).some((e) =>
          String(e).endsWith(".delete"),
        );
        if (isDelete) return; // account deletion signs out anyway
        // If (historically) two prefs docs exist for a user, stick with the
        // one we already hold — switching would redirect later writes.
        setProfile((prev) => (prev && prev.$id !== doc.$id ? prev : doc));
        setProfileError(null);
      });
    } catch (e) {
      console.log("[auth] prefs subscribe failed:", e?.message);
    }
    return () => {
      try {
        unsubscribe();
      } catch {
        /* already closed */
      }
    };
  }, [userId]);

  return (
    <AuthContext.Provider
      value={{
        isLoadingUser,
        user,
        signOut,
        profile,
        fetchUserProfile,
        setIsLoadingUser,
        setProfile,
        signInWithGoogle,
        signInWithApple,
        backendError,
        profileError,
        retry,
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
