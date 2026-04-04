import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors } from "@/lib/theme";
import { BottomSheetModal } from "@/components/BottomSheetModal";

type Props = {
  visible: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteAccountModal({ visible, isDeleting, onClose, onConfirm }: Props) {
  const [confirmText, setConfirmText] = useState("");

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  const handleConfirm = () => {
    setConfirmText("");
    onConfirm();
  };

  const isConfirmed = confirmText === "Confirm";

  return (
    <BottomSheetModal
      visible={visible}
      title="Delete Account"
      onClose={handleClose}
      avoidKeyboard
    >
      <View className="px-6 pt-5 pb-10">
        <Text className="text-tPrimary text-sm mb-4">
          This will permanently delete your account and all associated data. This action cannot be undone.
        </Text>

        <Text className="text-tSecondary text-sm mb-1">
          Type <Text className="text-tPrimary font-semibold">Confirm</Text> to proceed
        </Text>
        <TextInput
          className="bg-cards border border-border rounded-lg px-4 py-3 text-tPrimary mb-6"
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder="Confirm"
          placeholderTextColor={colors.tSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isDeleting}
          accessibilityLabel="Type Confirm to proceed"
          accessibilityHint="Enter the word Confirm to enable the delete button"
        />

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!isConfirmed || isDeleting}
          className={`py-3 rounded-lg items-center ${!isConfirmed || isDeleting ? "bg-red-500/40" : "bg-red-500"}`}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          accessibilityHint="Permanently deletes your account"
        >
          <Text className="text-white font-semibold">
            {isDeleting ? "Deleting..." : "Delete Account"}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}
