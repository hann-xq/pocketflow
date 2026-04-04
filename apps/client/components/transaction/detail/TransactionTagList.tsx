import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import type { ApiTag } from "@/lib/types";

type Props = {
  tags: ApiTag[];
  onTagPress: (tagId: string, tagName: string) => void;
  onEditTags: () => void;
};

export const TransactionTagList = ({ tags, onTagPress, onEditTags }: Props) => {
  if (tags.length === 0) {
    return (
      <TouchableOpacity
        className="px-4 py-4 bg-cards border-b border-border flex-row items-center"
        onPress={onEditTags}
        accessibilityRole="button"
        accessibilityLabel="Edit tags"
      >
        <View
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        >
          <MaterialCommunityIcons name="tag-multiple-outline" size={20} color="#fff" />
        </View>
        <Text className="flex-1 text-tPrimary text-base">Edit tags</Text>
        <MaterialCommunityIcons
          name="pencil-outline"
          size={22}
          color="#38BDF8"
          importantForAccessibility="no"
          accessibilityElementsHidden={true}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View className="px-4 py-4 bg-cards border-b border-border flex-row items-center">
      <View className="flex-1 flex-row flex-wrap gap-2">
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag.id}
            className="bg-accent/60 px-3 py-1 rounded-full"
            onPress={() => onTagPress(tag.id, tag.name)}
            accessibilityRole="button"
            accessibilityLabel={`View all transactions tagged ${tag.name}`}
          >
            <Text className="text-primary font-medium">#{tag.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        onPress={onEditTags}
        accessibilityRole="button"
        accessibilityLabel="Edit tags"
        className="px-2 -mr-2"
      >
        <MaterialCommunityIcons
          name="pencil-outline"
          size={22}
          color="#38BDF8"
          importantForAccessibility="no"
          accessibilityElementsHidden={true}
        />
      </TouchableOpacity>
    </View>
  );
};
