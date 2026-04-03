import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";

type Props = {
  tagName: string;
  onPress: () => void;
};

export const CreateTagOption = ({ tagName, onPress }: Props) => (
  <TouchableOpacity
    className="flex-row items-center px-4 py-4 bg-cards border-b border-border"
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Create tag ${tagName}`}
  >
    <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#257D71" style={{ marginRight: 10 }} />
    <Text className="text-primary text-sm">Create &quot;#{tagName}&quot;</Text>
  </TouchableOpacity>
);
