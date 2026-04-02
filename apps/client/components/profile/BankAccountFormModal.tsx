import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BankAccountFormState, ModalMode } from "@/lib/bank-account-utils";

type Props = {
  mode: ModalMode | null;
  form: BankAccountFormState;
  onChangeForm: (update: Partial<BankAccountFormState>) => void;
  ibanError: string | null;
  onClearIbanError: () => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function BankAccountFormModal({
  mode,
  form,
  onChangeForm,
  ibanError,
  onClearIbanError,
  onClose,
  onSubmit,
  isSubmitting,
}: Props) {
  const isCreate = mode?.type === "create";

  return (
    <Modal
      visible={mode !== null}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-background rounded-t-2xl px-6 pt-6 pb-10">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-tPrimary text-xl font-semibold">
              {isCreate ? "New Bank Account" : "Edit Bank Account"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text className="text-tSecondary text-sm mb-1">Account Name</Text>
          <TextInput
            className="bg-cards border border-border rounded-lg px-4 py-3 text-tPrimary mb-4"
            value={form.accountName}
            onChangeText={(v) => onChangeForm({ accountName: v })}
            placeholder="My Checking Account"
            placeholderTextColor="#64748B"
            autoCapitalize="words"
          />

          {isCreate && (
            <>
              <Text className="text-tSecondary text-sm mb-1">Account Number (IBAN)</Text>
              <TextInput
                className={`bg-cards border rounded-lg px-4 py-3 text-tPrimary ${ibanError ? "border-red-500 mb-1" : "border-border mb-6"}`}
                value={form.accountNumber}
                onChangeText={(v) => {
                  onChangeForm({ accountNumber: v.toUpperCase() });
                  onClearIbanError();
                }}
                placeholder="NL91ABNA0417164300"
                placeholderTextColor="#64748B"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {ibanError && (
                <Text className="text-red-500 text-xs mb-6" accessibilityRole="alert">
                  {ibanError}
                </Text>
              )}
            </>
          )}

          <TouchableOpacity
            onPress={onSubmit}
            disabled={isSubmitting}
            className={`py-3 rounded-lg items-center mt-2 ${isSubmitting ? "bg-accent/50" : "bg-accent"}`}
            accessibilityRole="button"
            accessibilityLabel={isCreate ? "Create bank account" : "Save changes"}
          >
            <Text className="text-white font-semibold">
              {isSubmitting ? "Saving..." : isCreate ? "Create Account" : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
