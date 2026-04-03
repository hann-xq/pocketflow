import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { TransactionList } from "@/components/transaction/TransactionList";
import { colors } from "@/lib/theme";

export default function TransactionsByTag() {
  const { tagId, tagName } = useLocalSearchParams<{ tagId: string; tagName: string }>();
  const { data: transactions = [], isLoading, error } = useTransactions();

  const filtered = transactions.filter((t) => t.tags.some((tag) => tag.id === tagId));

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
          <Text className="text-tPrimary text-base font-semibold" numberOfLines={1}>
            #{tagName}
          </Text>
        </View>
        <View className="w-9" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-tSecondary">Loading...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.tSecondary} />
          <Text className="text-tSecondary mt-4 text-center">{error?.message ?? "Failed to load transactions"}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialCommunityIcons name="tag-off-outline" size={48} color={colors.tSecondary} />
          <Text className="text-tSecondary mt-4 text-center">No transactions with this tag</Text>
        </View>
      ) : (
        <TransactionList
          transactions={filtered}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
}
