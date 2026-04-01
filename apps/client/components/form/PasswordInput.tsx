import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  accessibilityLabel: string;
  placeholder?: TextInputProps['placeholder'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
}

export default function PasswordInput({ value, onChangeText, accessibilityLabel, placeholder = 'Password', onSubmitEditing }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="flex-row items-center border border-border rounded-xl">
      <TextInput
        className="flex-1 px-4 py-3 text-tPrimary text-base"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        accessibilityLabel={accessibilityLabel}
        onSubmitEditing={onSubmitEditing}
      />

      <TouchableOpacity
        className="p-3"
        onPress={() => setShowPassword((v) => !v)}
        accessibilityLabel={showPassword ? `Hide ${accessibilityLabel.toLowerCase()}` : `Show ${accessibilityLabel.toLowerCase()}`}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons
          name={showPassword ? 'eye-off' : 'eye'}
          size={22}
        />
      </TouchableOpacity>
    </View>
  );
}
