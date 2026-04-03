import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BottomSheetModal } from "@/components/BottomSheetModal";

type Props = {
  visible: boolean;
  onClose: () => void;
  editAmount: string;
  editCounterpartyName: string;
  editCounterpartyAccount: string;
  onChangeAmount: (value: string) => void;
  onChangeCounterpartyName: (value: string) => void;
  onChangeCounterpartyAccount: (value: string) => void;
  onSave: () => void;
  isPending: boolean;
};

export function EditTransactionModal({
  visible,
  onClose,
  editAmount,
  editCounterpartyName,
  editCounterpartyAccount,
  onChangeAmount,
  onChangeCounterpartyName,
  onChangeCounterpartyAccount,
  onSave,
  isPending,
}: Props) {
  return (
    <BottomSheetModal
      visible={visible}
      title="Edit transaction"
      onClose={onClose}
    >
      <View className="px-4 py-4 gap-4">
        <View>
          <Text className="font-semibold text-tPrimary mb-2">Amount</Text>
          <View className="flex-row items-center bg-cards rounded-lg border border-border px-3">
            <Text className="text-tPrimary text-base mr-1">€</Text>
            <TextInput
              className="flex-1 py-3 text-tPrimary"
              value={editAmount}
              onChangeText={onChangeAmount}
              keyboardType="numeric"
              placeholder="e.g. -12.50"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Amount"
            />
          </View>
        </View>

        <View>
          <Text className="font-semibold text-tPrimary mb-2">Counterparty name</Text>
          <TextInput
            className="bg-cards text-tPrimary px-3 py-3 rounded-lg border border-border"
            value={editCounterpartyName}
            onChangeText={onChangeCounterpartyName}
            placeholder="Counterparty name"
            placeholderTextColor="#94A3B8"
            accessibilityLabel="Counterparty name"
          />
        </View>

        <View>
          <Text className="font-semibold text-tPrimary mb-2">Counterparty account</Text>
          <TextInput
            className="bg-cards text-tPrimary px-3 py-3 rounded-lg border border-border"
            value={editCounterpartyAccount}
            onChangeText={onChangeCounterpartyAccount}
            placeholder="BE68 5390 0754 7034"
            placeholderTextColor="#94A3B8"
            accessibilityLabel="Counterparty account"
          />
        </View>

        <TouchableOpacity
          className="py-3 bg-primary rounded-xl items-center mt-2"
          onPress={onSave}
          disabled={isPending}
          accessibilityRole="button"
          accessibilityLabel="Save transaction"
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}
