import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useDeleteTransaction } from "@/hooks/transactions/useDeleteTransaction";
import { TransactionList } from "@/components/transaction/TransactionList";
import { formatCurrency } from "@/lib/format";
import { Button } from "react-native-paper";

const LIST_CONTENT_STYLE = { paddingBottom: 32 };

export default function CategoryTransactions() {
  const params = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
    type: "spendings" | "income";
  }>();

  const { categoryId, categoryName, type } = params;

  const { data: transactions = [], isLoading, error, refetch } = useTransactions();
  const { mutate: deleteTransaction } = useDeleteTransaction();
  const handleDelete = useCallback((id: string) => deleteTransaction(id), [deleteTransaction]);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  cutoff.setHours(0, 0, 0, 0);

  const filtered = transactions.filter((t) => {
    const amount = parseFloat(t.amount);
    const matchesType = type === "income" ? amount > 0 : amount < 0;
    const matchesCategory =
      categoryId === "uncategorized"
        ? t.category == null
        : t.category?.id === categoryId;
    const inLast30Days = new Date(t.date) >= cutoff;
    return matchesType && matchesCategory && inLast30Days;
  });

  const total = filtered.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-tSecondary">Loading transactions...</Text>
      </View>
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
        <View className="flex-1">
          <Text className="text-tPrimary text-base font-semibold" numberOfLines={1}>
            {categoryName}
          </Text>
          <Text className="text-tSecondary text-xs">
            {type === "income" ? "+" : "-"}€{formatCurrency(total)} · last 30 days
          </Text>
        </View>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
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
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialCommunityIcons name="receipt-text-outline" size={56} color="#8FD5C8" />
          <Text className="text-tSecondary mt-4 text-center">No transactions in this category.</Text>
        </View>
      ) : (
        <TransactionList
          transactions={filtered}
          onDelete={handleDelete}
          contentContainerStyle={LIST_CONTENT_STYLE}
        />
      )}
    </SafeAreaView>
  );
}
