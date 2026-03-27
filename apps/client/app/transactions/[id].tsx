import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

type ApiTransaction = {
  id: string;
  description: string | null;
  amount: string;
  date: string;
  counterpartyName: string;
  counterpartyAccount: string;
  userId: string;
  category: {
    id: string;
    name: string;
    description: string;
  } | null;
  categoryId: string | null;
  tags: string[];
};

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
}

export default function TransactionDetail() {
  const params = useLocalSearchParams<{ data: string }>();
  const transaction: ApiTransaction = JSON.parse(params.data);

  const amount = parseFloat(transaction.amount);
  const isExpense = amount < 0;

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
            <Text className="text-tSecondary text-sm" numberOfLines={1}>
              {transaction.counterpartyAccount}
            </Text>
          </View>
          <View className="w-9" />
        </View>

        {/* Transaction summary */}
        <View className="flex-row items-center px-4 py-4 bg-cards border-b border-border">
          <View className="w-10 h-10 rounded-full bg-accent items-center justify-center mr-3" />
          <View className="flex-1">
            <Text className="text-tPrimary text-base font-medium" numberOfLines={1}>
              {transaction.counterpartyName || transaction.description || "Unknown"}
            </Text>
          </View>
          <Text className={`text-base font-semibold ${isExpense ? "text-tPrimary" : "text-primary"}`}>
            {isExpense ? "-" : "+"}€{Math.abs(amount).toFixed(2)}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Edit transaction section */}
          <View className="px-4 py-2 bg-background border-b border-border">
            <Text className="text-sm font-semibold text-tPrimary">Edit transaction</Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center px-4 py-4 bg-cards border-b border-border"
            accessibilityRole="button"
            accessibilityLabel={`Category: ${transaction.category?.name ?? "Uncategorized"}. Tap to edit.`}
          >
            <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
              <MaterialCommunityIcons name="tag-outline" size={20} color="#fff" />
            </View>
            <Text className="flex-1 text-tPrimary text-base">
              {transaction.category?.name ?? "Uncategorized"}
            </Text>
            <MaterialCommunityIcons name="pencil-outline" size={22} color="#38BDF8" />
          </TouchableOpacity>

          {/* Transaction details section */}
          <View className="px-4 py-2 bg-background border-b border-border mt-2">
            <Text className="text-sm font-semibold text-tPrimary">Transaction details</Text>
          </View>

          <View className="px-4 py-4 bg-cards border-b border-border">
            <Text className="text-sm font-semibold text-tPrimary mb-1">Date</Text>
            <Text className="text-tSecondary text-sm">{formatDisplayDate(transaction.date)}</Text>
          </View>

          <View className="px-4 py-4 bg-cards border-b border-border">
            <Text className="text-sm font-semibold text-tPrimary mb-1">Counterparty</Text>
            <Text className="text-tSecondary text-sm">{transaction.counterpartyName}</Text>
            <Text className="text-tSecondary text-sm">{transaction.counterpartyAccount}</Text>
          </View>

          {transaction.description && (
            <View className="px-4 py-4 bg-cards border-b border-border">
              <Text className="text-sm font-semibold text-tPrimary mb-1">Description</Text>
              <Text className="text-tSecondary text-sm">{transaction.description}</Text>
            </View>
          )}

          {transaction.tags.length > 0 && (
            <View className="px-4 py-4 bg-cards border-b border-border">
              <Text className="text-sm font-semibold text-tPrimary mb-2">Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {transaction.tags.map((tag, i) => (
                  <View key={i} className="bg-accent px-3 py-1 rounded-full">
                    <Text className="text-tSecondary text-xs">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
