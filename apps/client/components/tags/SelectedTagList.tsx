import { Text, View } from "react-native";
import type { ApiTag } from "@/lib/types";
import { TagChip } from "./TagChip";

type Props = {
  tags: ApiTag[];
  onRemove: (tag: ApiTag) => void;
};

export const SelectedTagList = ({ tags, onRemove }: Props) => (
  <View className="px-4 py-4 bg-cards border-b border-border min-h-16">
    {tags.length === 0 ? (
      <Text className="text-tSecondary text-sm">No tags added yet</Text>
    ) : (
      <View className="flex-row flex-wrap gap-2">
        {tags.map((tag) => (
          <TagChip key={tag.id} tag={tag} onRemove={() => onRemove(tag)} />
        ))}
      </View>
    )}
  </View>
);
