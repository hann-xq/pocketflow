import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function TransactionDetails() {
  const { id } = useLocalSearchParams();

  return (
      <View>
        <Text accessibilityLabel={`Transaction ID: ${id}`}>Transaction id: {id}.</Text>
      </View>
  );
}