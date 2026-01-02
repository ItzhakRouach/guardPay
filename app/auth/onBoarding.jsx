import { useRouter } from "expo-router";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function OnBoardingScreen() {
  //set navigation so can navigate to the correct View
  const router = useRouter();
  return (
    <View>
      <Text>This is onboarding screen</Text>
    </View>
  );
}
