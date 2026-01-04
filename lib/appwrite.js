import { Account, Client, Databases } from "react-native-appwrite";

// initilze client
export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM);

// initilize account and databases
export const account = new Account(client);
export const databases = new Databases(client);

//initilize databases and tables to be in used
export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DB;
export const USERS_PREFS = process.env.EXPO_PUBLIC_APPWRITE_USERS_PREFS_ID;
export const SHIFTS_HISTORY =
  process.env.EXPO_PUBLIC_APPWRITE_SHIFTS_HISTORY_ID;
