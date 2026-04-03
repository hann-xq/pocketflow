import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import type { ApiTag } from "@/lib/types";

type Props = {
  tag: ApiTag;
  onRemove: () => void;
};

export function TagChip({ tag, onRemove }: Props) {
  return (
    <View className="flex-row items-center bg-accent px-3 py-1 rounded-full gap-1">
      <Text className="text-primary font-medium">#{tag.name}</Text>
      <TouchableOpacity
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove tag ${tag.name}`}
      >
        <MaterialCommunityIcons name="close" size={14} color="#257D71" />
      </TouchableOpacity>
    </View>
  );
}
