import { Text, View } from "react-native";
import "../global.css";

export default function Profile() {
  return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl text-primary font-bold" accessibilityRole="header">Profile.</Text>
      </View>
  );
}