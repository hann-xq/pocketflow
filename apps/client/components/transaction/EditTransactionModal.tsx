import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BottomSheetModal } from "@/components/BottomSheetModal";
import { validateTransactionEdit } from "@/lib/validation";

type EditValues = {
  amount: string;
  description: string;
  counterpartyName: string;
  counterpartyAccount: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  initialValues: EditValues;
  isExternal: boolean;
  onSave: (values: EditValues) => void;
  isPending: boolean;
};

export function EditTransactionModal({
  visible,
  onClose,
  initialValues,
  isExternal,
  onSave,
  isPending,
}: Props) {
  const [amount, setAmount] = useState(initialValues.amount);
  const [description, setDescription] = useState(initialValues.description);
  const [counterpartyName, setCounterpartyName] = useState(initialValues.counterpartyName);
  const [counterpartyAccount, setCounterpartyAccount] = useState(initialValues.counterpartyAccount);
  const [errors, setErrors] = useState<Partial<Record<keyof EditValues, string>>>({});

  useEffect(() => {
    if (visible) {
      setAmount(initialValues.amount);
      setDescription(initialValues.description);
      setCounterpartyName(initialValues.counterpartyName);
      setCounterpartyAccount(initialValues.counterpartyAccount);
      setErrors({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSave = () => {
    const validationErrors = validateTransactionEdit({
      amount,
      description: isExternal ? '' : description,
      counterpartyName,
      counterpartyAccount,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    onSave({ amount, description, counterpartyName, counterpartyAccount });
  };

  return (
    <BottomSheetModal
      visible={visible}
      title="Edit transaction"
      onClose={onClose}
      avoidKeyboard
    >
      <View className="px-4 py-4 gap-4">
        <View>
          <Text className="font-semibold text-tPrimary mb-2">Amount</Text>
          <View
            className={`flex-row items-center bg-cards rounded-lg border px-3 ${errors.amount ? "border-red-500" : "border-border"}`}
          >
            <Text className="text-tPrimary text-base mr-1">€</Text>
            <TextInput
              className="flex-1 py-3 text-tPrimary"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="e.g. 12.50"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Amount"
            />
          </View>
          {errors.amount && (
            <Text className="text-red-500 text-xs mt-1" accessibilityRole="alert">
              {errors.amount}
            </Text>
          )}
        </View>

        {!isExternal && (
          <View>
            <Text className="font-semibold text-tPrimary mb-2">Description</Text>
            <TextInput
              className={`bg-cards text-tPrimary px-3 py-3 rounded-lg border ${errors.description ? "border-red-500" : "border-border"}`}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Description"
            />
            {errors.description && (
              <Text className="text-red-500 text-xs mt-1" accessibilityRole="alert">
                {errors.description}
              </Text>
            )}
          </View>
        )}

        <View>
          <Text className="font-semibold text-tPrimary mb-2">Counterparty name</Text>
          <TextInput
            className={`bg-cards text-tPrimary px-3 py-3 rounded-lg border ${errors.counterpartyName ? "border-red-500" : "border-border"}`}
            value={counterpartyName}
            onChangeText={setCounterpartyName}
            placeholder="Counterparty name"
            placeholderTextColor="#94A3B8"
            accessibilityLabel="Counterparty name"
          />
          {errors.counterpartyName && (
            <Text className="text-red-500 text-xs mt-1" accessibilityRole="alert">
              {errors.counterpartyName}
            </Text>
          )}
        </View>

        <View>
          <Text className="font-semibold text-tPrimary mb-2">Counterparty account</Text>
          <TextInput
            className={`bg-cards text-tPrimary px-3 py-3 rounded-lg border ${errors.counterpartyAccount ? "border-red-500" : "border-border"}`}
            value={counterpartyAccount}
            onChangeText={setCounterpartyAccount}
            placeholder="BE68 5390 0754 7034"
            placeholderTextColor="#94A3B8"
            accessibilityLabel="Counterparty account"
          />
          {errors.counterpartyAccount && (
            <Text className="text-red-500 text-xs mt-1" accessibilityRole="alert">
              {errors.counterpartyAccount}
            </Text>
          )}
        </View>

        <TouchableOpacity
          className="py-3 bg-primary rounded-xl items-center mt-2"
          onPress={handleSave}
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
