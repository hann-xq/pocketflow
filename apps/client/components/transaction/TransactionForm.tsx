import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CategoryPickerModal } from "@/components/transaction/CategoryPickerModal";
import type { ApiBankAccount, ApiCategory, TransactionForm as TransactionFormValues } from "@/lib/types";

type Props = {
  form: TransactionFormValues;
  setForm: React.Dispatch<React.SetStateAction<TransactionFormValues>>;
  errors: Partial<Record<keyof TransactionFormValues, string>>;
  categories: ApiCategory[];
  bankAccounts: ApiBankAccount[];
  onSubmit: () => void;
  isPending: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
};

export function TransactionForm({
  form,
  setForm,
  errors,
  categories,
  bankAccounts,
  onSubmit,
  isPending,
  isLoading,
  isError,
  errorMessage,
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [bankAccountPickerOpen, setBankAccountPickerOpen] = useState(false);

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const selectedBankAccount = bankAccounts.find((b) => b.id === form.bankAccountId);

  return (
    <>
      <ScrollView
        className="flex-1 px-4 pt-4"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {isError && (
          <View className="mb-5 p-3 bg-red-100 rounded-lg">
            <Text className="text-red-600 text-sm">
              {errorMessage ?? "Failed to create transaction"}
            </Text>
          </View>
        )}

        {/* Amount + Expense Toggle */}
        <View className="mb-4">
          <Text className="text-tSecondary text-xs mb-1">Amount *</Text>
          <View className="flex-row items-center gap-3">
            <View
              className={`flex-1 flex-row items-center bg-cards border rounded-lg px-3 ${errors.amount ? "border-red-500" : "border-border"}`}
            >
              <Text className="text-tPrimary text-base mr-1">€</Text>
              <TextInput
                className="flex-1 py-3 text-tPrimary text-base"
                placeholder="42.50"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={form.amount}
                onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                accessibilityLabel="Amount"
              />
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-tPrimary text-base">Expense</Text>
              <Switch
                value={form.isExpense}
                onValueChange={(v) => setForm((f) => ({ ...f, isExpense: v, categoryId: "" }))}
                accessibilityLabel="Expense toggle"
              />
            </View>
          </View>
          {errors.amount && <Text className="text-red-500 text-xs mt-1">{errors.amount}</Text>}
        </View>

        {/* Date */}
        <View className="mb-4">
          <Text className="text-tSecondary text-xs mb-1">Date *</Text>
          <TouchableOpacity
            className={`bg-cards border rounded-lg px-3 py-3 flex-row items-center justify-between ${errors.date ? "border-red-500" : "border-border"}`}
            onPress={() => setShowDatePicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Select date"
          >
            <Text className="text-tPrimary text-base">{form.date}</Text>
            <MaterialCommunityIcons name="calendar" size={20} color="#94A3B8" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(form.date)}
              mode="date"
              maximumDate={new Date()}
              onChange={(_event: DateTimePickerEvent, selected?: Date) => {
                if (Platform.OS === "android") setShowDatePicker(false);
                if (selected) setForm((f) => ({ ...f, date: selected.toISOString().split("T")[0] }));
              }}
            />
          )}
          {errors.date && <Text className="text-red-500 text-xs mt-1">{errors.date}</Text>}
        </View>

        {/* Category */}
        <View className="mb-4">
          <Text className="text-tSecondary text-xs mb-1">Category *</Text>
          <TouchableOpacity
            className={`bg-cards border rounded-lg px-3 py-3 flex-row items-center justify-between ${errors.categoryId ? "border-red-500" : "border-border"}`}
            onPress={() => setCategoryPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Select category"
          >
            <Text className={selectedCategory ? "text-tPrimary text-base" : "text-[#94A3B8] text-base"}>
              {selectedCategory ? selectedCategory.name : "Select a category"}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>
          {errors.categoryId && <Text className="text-red-500 text-xs mt-1">{errors.categoryId}</Text>}
        </View>

        {/* Bank Account */}
        <View className="mb-4">
          <Text className="text-tSecondary text-xs mb-1">Bank Account *</Text>
          <TouchableOpacity
            className={`bg-cards border rounded-lg px-3 py-3 flex-row items-center justify-between ${errors.bankAccountId ? "border-red-500" : "border-border"}`}
            onPress={() => setBankAccountPickerOpen((o) => !o)}
            accessibilityLabel="Select bank account"
          >
            <Text className={selectedBankAccount ? "text-tPrimary text-base" : "text-[#94A3B8] text-base"}>
              {selectedBankAccount
                ? `${selectedBankAccount.accountName} (${selectedBankAccount.accountNumber})`
                : "Select a bank account"}
            </Text>
            <MaterialCommunityIcons
              name={bankAccountPickerOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
          {bankAccountPickerOpen && (
            <View className="bg-cards border border-border rounded-lg mt-1 overflow-hidden">
              {bankAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  className={`px-3 py-3 border-b border-border ${form.bankAccountId === account.id ? "bg-accent" : ""}`}
                  onPress={() => {
                    setForm((f) => ({ ...f, bankAccountId: account.id }));
                    setBankAccountPickerOpen(false);
                  }}
                  accessibilityLabel={`${account.accountName} ${account.accountNumber}`}
                >
                  <Text className="text-tPrimary text-base">{account.accountName}</Text>
                  <Text className="text-tSecondary text-xs">{account.accountNumber}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.bankAccountId && (
            <Text className="text-red-500 text-xs mt-1">{errors.bankAccountId}</Text>
          )}
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-tSecondary text-xs mb-1">Description</Text>
          <TextInput
            className="bg-cards border border-border rounded-lg px-3 py-3 text-tPrimary text-base"
            placeholder="Optional"
            placeholderTextColor="#94A3B8"
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            accessibilityLabel="Description"
          />
        </View>

        {/* Counterparty Name */}
        <View className="mb-4">
          <Text className="text-tSecondary text-xs mb-1">Counterparty Name</Text>
          <TextInput
            className="bg-cards border border-border rounded-lg px-3 py-3 text-tPrimary text-base"
            placeholder="Optional"
            placeholderTextColor="#94A3B8"
            value={form.counterpartyName}
            onChangeText={(v) => setForm((f) => ({ ...f, counterpartyName: v }))}
            accessibilityLabel="Counterparty name"
          />
        </View>

        {/* Counterparty Account */}
        <View className="mb-4">
          <Text className="text-tSecondary text-xs mb-1">Counterparty Account</Text>
          <TextInput
            className="bg-cards border border-border rounded-lg px-3 py-3 text-tPrimary text-base"
            placeholder="Optional"
            placeholderTextColor="#94A3B8"
            value={form.counterpartyAccount}
            onChangeText={(v) => setForm((f) => ({ ...f, counterpartyAccount: v }))}
            accessibilityLabel="Counterparty account"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="py-4 bg-primary rounded-xl items-center mt-2"
          onPress={onSubmit}
          disabled={isPending || isLoading}
          accessibilityLabel="Save transaction"
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Save Transaction</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CategoryPickerModal
        visible={categoryPickerOpen}
        onClose={() => setCategoryPickerOpen(false)}
        selectedCategoryId={form.categoryId}
        onSelect={(id) => {
          setForm((f) => ({ ...f, categoryId: id }));
          setCategoryPickerOpen(false);
        }}
        transactionType={form.isExpense ? "expense" : "income"}
      />
    </>
  );
}
