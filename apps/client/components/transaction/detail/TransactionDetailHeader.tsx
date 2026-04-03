import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
  onBack: () => void;
};

export function TransactionDetailHeader({ title, onBack }: Props) {
  return (
    <View className="flex-row items-center px-4 py-3 bg-cards border-b border-border">
      <TouchableOpacity
        onPress={onBack}
        className="mr-3 p-1"
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <MaterialCommunityIcons name="chevron-left" size={28} color="#94A3B8" />
      </TouchableOpacity>
      <View className="flex-1 items-center">
        <Text className="text-tSecondary text-sm" numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View className="w-9" />
    </View>
  );
}
