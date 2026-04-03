import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";
import type { ApiTag } from "@/lib/types";

type Props = {
  tag: ApiTag;
  onPress: () => void;
};

export const TagSuggestionItem = ({ tag, onPress }: Props) => (
  <TouchableOpacity
    className="flex-row items-center px-4 py-4 bg-cards border-b border-border"
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Add tag ${tag.name}`}
  >
    <MaterialCommunityIcons name="tag-outline" size={18} color="#257D71" style={{ marginRight: 10 }} />
    <Text className="text-tPrimary text-sm">#{tag.name}</Text>
  </TouchableOpacity>
);
