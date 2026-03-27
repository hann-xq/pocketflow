import { Text, View } from "react-native";
import "../global.css";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center align-middle">
      <Text className="text-4xl text-primary font-bold" accessibilityRole="header">PocketFlow Prototype</Text>
    </View>
  );
}
