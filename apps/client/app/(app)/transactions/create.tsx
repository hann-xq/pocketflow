import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionForm } from "@/components/transaction/TransactionForm";
import type { TransactionForm as TransactionFormValues } from "@/lib/types";
import { useCategories } from "@/hooks/categories/useCategories";
import { useBankAccounts } from "@/hooks/bank-accounts/useBankAccounts";
import { useCreateTransaction } from "@/hooks/transactions/useCreateTransaction";

function todayISODate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function CreateTransaction() {
  const [form, setForm] = useState<TransactionFormValues>({
    amount: "",
    isExpense: true,
    date: todayISODate(),
    description: "",
    counterpartyName: "",
    counterpartyAccount: "",
    categoryId: "",
    bankAccountId: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormValues, string>>>({});

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: bankAccounts = [], isLoading: bankAccountsLoading } = useBankAccounts();
  const createTransaction = useCreateTransaction();

  useEffect(() => {
    if (bankAccounts.length > 0) {
      setForm((f) => ({
        ...f,
        bankAccountId: f.bankAccountId !== "" ? f.bankAccountId : bankAccounts[0].id,
      }));
    }
  }, [bankAccounts]);

  useEffect(() => {
    const type = form.isExpense ? "expense" : "income";
    const uncategorized = categories.find((c) => c.slug === "uncategorized" && c.type === type);
    if (uncategorized) {
      setForm((f) => ({
        ...f,
        categoryId: f.categoryId !== "" ? f.categoryId : uncategorized.id,
      }));
    }
  }, [categories, form.isExpense]);

  function validate(): boolean {
    const next: Partial<Record<keyof TransactionFormValues, string>> = {};
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

    createTransaction.mutate(
      {
        bankAccountId: form.bankAccountId,
        amount,
        date: form.date,
        description: form.description || null,
        counterpartyName: form.counterpartyName || null,
        counterpartyAccount: form.counterpartyAccount || null,
        categoryId: form.categoryId,
      },
      { onSuccess: () => router.back() }
    );
  }

  return (
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

      <TransactionForm
        form={form}
        setForm={setForm}
        errors={errors}
        categories={categories}
        bankAccounts={bankAccounts}
        onSubmit={handleSubmit}
        isPending={createTransaction.isPending}
        isLoading={categoriesLoading || bankAccountsLoading}
        isError={createTransaction.isError}
        errorMessage={(createTransaction.error as { message?: string })?.message}
      />
    </SafeAreaView>
  );
}
