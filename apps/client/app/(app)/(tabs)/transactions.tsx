import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import { colors } from "@/lib/theme";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useDeleteTransaction } from "@/hooks/transactions/useDeleteTransaction";
import { TransactionList } from "@/components/transaction/TransactionList";

export default function Transactions() {
  const { data: transactions = [], isLoading, error, refetch } = useTransactions();
  const { mutate: deleteTransaction } = useDeleteTransaction();
  const handleDelete = useCallback((id: string) => deleteTransaction(id), [deleteTransaction]);

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        accessible={true}
        accessibilityLiveRegion="polite"
        accessibilityLabel="Loading transactions"
      >
        <Text className="text-tSecondary">Loading transactions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.tSecondary} />
        <Text className="text-tSecondary mt-4 text-center">{error?.message ?? "Failed to load transactions"}</Text>
        <Button
          mode="contained"
          onPress={() => refetch()}
          accessibilityLabel="Retry loading transactions"
          style={{ marginTop: 24 }}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      {transactions.length === 0 ? (
        <View
          className="flex-1 items-center justify-center gap-3"
          accessible={true}
          accessibilityLabel="No transactions"
        >
          <MaterialCommunityIcons name="receipt-text-outline" size={72} color={colors.tSecondary} />
          <Text className="text-base text-tSecondary">No transactions yet</Text>
        </View>
      ) : (
        <TransactionList
          transactions={transactions}
          onDelete={handleDelete}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        onPress={() => router.push("/transactions/create")}
        accessibilityRole="button"
        accessibilityLabel="Add new transaction"
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
