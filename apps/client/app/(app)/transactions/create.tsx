import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ApiCategory, ApiBankAccount, TransactionForm } from "@/lib/types";

function todayISODate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function CreateTransaction() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TransactionForm>({
    amount: "",
    isExpense: true,
    date: todayISODate(),
    description: "",
    counterpartyName: "",
    counterpartyAccount: "",
    categoryId: "",
    bankAccountId: "",
  });
  const { userId } = useAuth();
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionForm, string>>>({});
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [bankAccountPickerOpen, setBankAccountPickerOpen] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ApiCategory[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories"),
  });

  const { data: bankAccounts = [], isLoading: bankAccountsLoading } = useQuery<ApiBankAccount[]>({
    queryKey: ["bankAccounts", userId],
    queryFn: () => api.get(`/users/${userId}/bank-accounts`),
    select: (data) => {
      if (data.length > 0 && !form.bankAccountId) {
        setForm((f) => ({ ...f, bankAccountId: data[0].id }));
      }
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: object) => api.post(`/bank-accounts/${form.bankAccountId}/transactions`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      router.back();
    },
  });

  function validate(): boolean {
    const next: Partial<Record<keyof TransactionForm, string>> = {};
    const parsed = parseFloat(form.amount);
    if (!form.amount || isNaN(parsed)) next.amount = "Enter a valid amount";
    if (!form.date || !/^\d{4}-\d{2}-\d{2}$/.test(form.date)) next.date = "Use format YYYY-MM-DD";
    if (!form.categoryId) next.categoryId = "Select a category";
    if (!form.bankAccountId) next.bankAccountId = "No bank account found";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const rawAmount = parseFloat(form.amount);
    const amount = form.isExpense ? -Math.abs(rawAmount) : Math.abs(rawAmount);
    mutation.mutate({
      amount,
      date: form.date,
      categoryId: form.categoryId,
      ...(form.description ? { description: form.description } : {}),
      ...(form.counterpartyName ? { counterpartyName: form.counterpartyName } : {}),
      ...(form.counterpartyAccount ? { counterpartyAccount: form.counterpartyAccount } : {}),
    });
  }

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const selectedBankAccount = bankAccounts.find((b) => b.id === form.bankAccountId);
  const isLoading = categoriesLoading || bankAccountsLoading;

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-cards border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#94A3B8" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-tPrimary text-base font-semibold">New Transaction</Text>
          </View>
          <View className="w-9" />
        </View>

        <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
          {mutation.isError && (
            <View className="mb-5 p-3 bg-red-100 rounded-lg">
              <Text className="text-red-600 text-sm">
                {(mutation.error as { message?: string })?.message ?? "Failed to create transaction"}
              </Text>
            </View>
          )}

          {/* Amount + Expense Toggle */}
          <View className="mb-4">
            <Text className="text-tSecondary text-xs mb-1">Amount *</Text>
            <View className="flex-row items-center gap-3">
              <TextInput
                className={`flex-1 bg-cards border rounded-lg px-3 py-3 text-tPrimary text-base ${errors.amount ? "border-red-500" : "border-border"}`}
                placeholder="e.g. 42.50"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={form.amount}
                onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
              />
              <View className="flex-row items-center gap-1">
                <Text className="text-tPrimary text-base">Expense</Text>
                <Switch
                  value={form.isExpense}
                  onValueChange={(v) => setForm((f) => ({ ...f, isExpense: v }))}
                />
              </View>
            </View>
            {errors.amount && <Text className="text-red-500 text-xs mt-1">{errors.amount}</Text>}
          </View>

          {/* Date */}
          <View className="mb-4">
            <Text className="text-tSecondary text-xs mb-1">Date *</Text>
            <TextInput
              className={`bg-cards border rounded-lg px-3 py-3 text-tPrimary text-base ${errors.date ? "border-red-500" : "border-border"}`}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              value={form.date}
              onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
            />
            {errors.date && <Text className="text-red-500 text-xs mt-1">{errors.date}</Text>}
          </View>

          {/* Category */}
          <View className="mb-4">
            <Text className="text-tSecondary text-xs mb-1">Category *</Text>
            <TouchableOpacity
              className={`bg-cards border rounded-lg px-3 py-3 flex-row items-center justify-between ${errors.categoryId ? "border-red-500" : "border-border"}`}
              onPress={() => setCategoryPickerOpen((o) => !o)}
              accessibilityLabel="Select category"
            >
              <Text className={selectedCategory ? "text-tPrimary text-base" : "text-[#94A3B8] text-base"}>
                {selectedCategory ? selectedCategory.name : "Select a category"}
              </Text>
              <MaterialCommunityIcons
                name={categoryPickerOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
            {categoryPickerOpen && (
              <View className="bg-cards border border-border rounded-lg mt-1 overflow-hidden">
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    className={`px-3 py-3 border-b border-border ${form.categoryId === cat.id ? "bg-accent" : ""}`}
                    onPress={() => {
                      setForm((f) => ({ ...f, categoryId: cat.id }));
                      setCategoryPickerOpen(false);
                    }}
                  >
                    <Text className="text-tPrimary text-base">{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
                {selectedBankAccount ? `${selectedBankAccount.accountName} (${selectedBankAccount.accountNumber})` : "Select a bank account"}
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
                  >
                    <Text className="text-tPrimary text-base">{account.accountName}</Text>
                    <Text className="text-tSecondary text-xs">{account.accountNumber}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.bankAccountId && <Text className="text-red-500 text-xs mt-1">{errors.bankAccountId}</Text>}
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
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className="py-4 bg-primary rounded-xl items-center mt-2"
            onPress={handleSubmit}
            disabled={mutation.isPending || isLoading}
            accessibilityLabel="Save transaction"
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">Save Transaction</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
