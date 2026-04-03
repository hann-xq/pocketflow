import { TextInput, View } from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

export const TagInput = ({ value, onChangeText }: Props) => (
  <View className="px-4 py-4 bg-cards border-b border-border">
    <TextInput
      className="bg-background text-tPrimary px-3 py-3 rounded-lg border border-border"
      value={value}
      onChangeText={onChangeText}
      placeholder="Type a tag name..."
      placeholderTextColor="#94A3B8"
      autoCapitalize="none"
      autoCorrect={false}
      accessibilityLabel="Tag name input"
    />
  </View>
);
