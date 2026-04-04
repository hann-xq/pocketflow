import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { CategoryPickerModal } from "@/components/transaction/CategoryPickerModal";
import { EditTransactionModal } from "@/components/transaction/EditTransactionModal";
import { TransactionCategoryRow } from "@/components/transaction/detail/TransactionCategoryRow";
import { TransactionDetailHeader } from "@/components/transaction/detail/TransactionDetailHeader";
import { TransactionDetailsSection } from "@/components/transaction/detail/TransactionDetailsSection";
import { TransactionSummaryRow } from "@/components/transaction/detail/TransactionSummaryRow";
import { TransactionTagList } from "@/components/transaction/detail/TransactionTagList";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useUpdateTransaction } from "@/hooks/transactions/useUpdateTransaction";
import { useDeleteTransaction } from "@/hooks/transactions/useDeleteTransaction";
import { useBankAccounts } from "@/hooks/bank-accounts/useBankAccounts";
import type { ApiTransaction } from "@/lib/types";

export default function TransactionDetail() {
  const params = useLocalSearchParams<{ id: string; data: string }>();
  const initial: ApiTransaction = JSON.parse(params.data);

  const { data: transactions = [] } = useTransactions();
  const transaction = transactions.find((t) => t.id === initial.id) ?? initial;

  const { data: bankAccounts = [] } = useBankAccounts();
  const bankAccount = bankAccounts.find((a) => a.id === transaction.bankAccountId);

  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const amount = parseFloat(transaction.amount);
  const isExpense = amount < 0;
  const displayName = transaction.counterpartyName ?? "";

  const deleteLabel = transaction.counterpartyName ?? `${isExpense ? "Expense" : "Income"} for €${Math.abs(amount).toFixed(2)}`;

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete "${deleteLabel}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTransaction.mutate(transaction.id, { onSuccess: () => router.back() }),
        },
      ]
    );
  };

  const handleCategorySelect = (categoryId: string) => {
    updateTransaction.mutate(
      { id: transaction.id, categoryId },
      { onSuccess: () => setPickerVisible(false) }
    );
  };

  const handleTransactionEdit = (values: { amount: string; description: string; counterpartyName: string; counterpartyAccount: string }) => {
    updateTransaction.mutate(
      {
        id: transaction.id,
        amount: parseFloat(values.amount) * (isExpense ? -1 : 1),
        ...(!transaction.isExternal && { description: values.description || null }),
        counterpartyName: values.counterpartyName || null,
        counterpartyAccount: values.counterpartyAccount || null,
      },
      { onSuccess: () => setEditModalVisible(false) }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <TransactionDetailHeader
        title={displayName}
        onBack={() => router.back()}
      />

      <TransactionSummaryRow
        displayName={displayName}
        description={transaction.description}
        amount={amount}
        isExpense={isExpense}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-4 py-2 bg-background border-b border-border">
          <Text className="font-semibold text-tPrimary">Category</Text>
        </View>

        <TransactionCategoryRow
          categoryName={transaction.category?.name}
          onPress={() => setPickerVisible(true)}
        />

        <View className="px-4 py-2 bg-background border-b border-border mt-2">
          <Text className="font-semibold text-tPrimary">Tags</Text>
        </View>

        <TransactionTagList
          tags={transaction.tags}
          onTagPress={(tagId, tagName) =>
            router.push({ pathname: "/transactions/by-tag", params: { tagId, tagName } })
          }
          onEditTags={() =>
            router.push({ pathname: "/transactions/edit-tags", params: { transactionId: transaction.id } })
          }
        />

        <View className="px-4 py-2 bg-background border-b border-border mt-2">
          <Text className="font-semibold text-tPrimary">Transaction details</Text>
        </View>

        <TransactionDetailsSection
          date={transaction.date}
          bankAccountName={bankAccount?.accountName ?? ""}
          bankAccountNumber={bankAccount?.accountNumber ?? ""}
          counterpartyName={transaction.counterpartyName}
          counterpartyAccount={transaction.counterpartyAccount}
          description={transaction.description}
        />

        <TouchableOpacity
          className="mx-4 mt-6 py-3 bg-primary rounded-xl items-center"
          onPress={() => setEditModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Edit transaction"
        >
          <Text className="text-white font-semibold text-base">Edit transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mx-4 mt-3 py-3 border border-red-500 rounded-xl items-center"
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete transaction"
        >
          <Text className="text-red-500 font-semibold text-base">Delete transaction</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditTransactionModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        isExternal={transaction.isExternal}
        initialValues={{
          amount: Math.abs(parseFloat(transaction.amount)).toString(),
          description: transaction.description ?? "",
          counterpartyName: transaction.counterpartyName ?? "",
          counterpartyAccount: transaction.counterpartyAccount ?? "",
        }}
        onSave={handleTransactionEdit}
        isPending={updateTransaction.isPending}
      />

      <CategoryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        selectedCategoryId={transaction.category?.id}
        onSelect={handleCategorySelect}
        isPending={updateTransaction.isPending}
        transactionType={isExpense ? "expense" : "income"}
      />
    </SafeAreaView>
  );
}
