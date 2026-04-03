import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors } from "@/lib/theme";
import { BottomSheetModal } from "@/components/BottomSheetModal";
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
    <BottomSheetModal
      visible={mode !== null}
      title={isCreate ? "New Bank Account" : "Edit Bank Account"}
      onClose={onClose}
    >
      <View className="px-6 pt-5 pb-10">
        <Text className="text-tSecondary text-sm mb-1">Account Name</Text>
        <TextInput
          className="bg-cards border border-border rounded-lg px-4 py-3 text-tPrimary mb-4"
          value={form.accountName}
          onChangeText={(v) => onChangeForm({ accountName: v })}
          placeholder="My Checking Account"
          placeholderTextColor={colors.tSecondary}
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
              placeholderTextColor={colors.tSecondary}
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
          className={`py-3 rounded-lg items-center mt-2 ${isSubmitting ? "bg-accent/50" : "bg-primary"}`}
          accessibilityRole="button"
          accessibilityLabel={isCreate ? "Create bank account" : "Save changes"}
        >
          <Text className="text-white font-semibold">
            {isSubmitting ? "Saving..." : isCreate ? "Create Account" : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}
