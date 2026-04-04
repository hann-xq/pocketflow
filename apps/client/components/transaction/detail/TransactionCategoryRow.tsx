import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  categoryName: string | undefined | null;
  onPress: () => void;
};

export function TransactionCategoryRow({ categoryName, onPress }: Props) {
  const label = categoryName ?? "Uncategorized";

  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-4 bg-cards border-b border-border"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Category: ${label}. Tap to edit.`}
    >
      <View
        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden={true}
      >
        <MaterialCommunityIcons name="tag-outline" size={20} color="#fff" />
      </View>
      <Text className="flex-1 text-tPrimary text-base">{label}</Text>
      <MaterialCommunityIcons name="pencil-outline" size={22} color="#38BDF8" importantForAccessibility="no" accessibilityElementsHidden={true} />
    </TouchableOpacity>
  );
}
