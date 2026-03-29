import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { api } from "@/lib/api";

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

type Section = { title: string; data: ApiTransaction[] };

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function groupByDate(transactions: ApiTransaction[]): Section[] {
  const map: Record<string, ApiTransaction[]> = {};
  for (const t of transactions) {
    if (!map[t.date]) map[t.date] = [];
    map[t.date].push(t);
  }
  return Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({ title: date, data: map[date] }));
}

function parseAmount(amount: string): number {
  return parseFloat(amount);
}

async function fetchTransactions(): Promise<ApiTransaction[]> {
  return api.get("/users/0b12db8d-0aae-43e4-b987-f72fde9ca2cc/transactions");
}

export default function Transactions() {
  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });

  const sections = groupByDate(transactions);

  const balance = transactions.reduce((sum: number, t: ApiTransaction) => sum + parseAmount(t.amount), 0);

  const renderItem = ({ item }: { item: ApiTransaction }) => {
    const amount = parseAmount(item.amount);
    const isExpense = amount < 0;
    const displayTitle = item.counterpartyName || item.description || "Unknown";

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/transactions/[id]", params: { id: item.id, data: JSON.stringify(item) } })}
        accessibilityRole="button"
        accessibilityLabel={`${displayTitle}, ${isExpense ? "-" : "+"}€${Math.abs(amount).toFixed(2)}`}
        accessibilityHint="Opens transaction details"
      >
        <View className="flex-row items-center px-4 py-3 bg-cards border-b border-border">
          <View
            className="w-10 h-10 rounded-full bg-accent items-center justify-center mr-3"
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden={true}
          />
          <View className="flex-1 mr-2">
            <Text className="text-tPrimary text-base" numberOfLines={1}>
              {displayTitle}
            </Text>
            {item.category && (
              <Text className="text-tSecondary text-xs" numberOfLines={1}>
                {item.category.name}
              </Text>
            )}
          </View>
          <Text className={`text-base font-semibold ${isExpense ? "text-tPrimary" : "text-primary"}`}>
            {isExpense ? "-" : "+"}€{Math.abs(amount).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View
      className="px-4 py-2 bg-background border-b border-border"
      accessibilityRole="header"
      accessible={true}
      accessibilityLabel={`Transactions for ${formatDisplayDate(section.title)}`}
    >
      <Text className="text-sm text-tSecondary" importantForAccessibility="no">
        {formatDisplayDate(section.title)}
      </Text>
    </View>
  );

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
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#64748B" />
        <Text className="text-tSecondary mt-4 text-center">{error?.message ?? "Failed to load transactions"}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-background">
        {/* Balance Header */}
        <View
          className="items-center py-6 bg-cards border-b border-border"
          accessible={true}
          accessibilityLabel={`Balance: €${balance.toFixed(2)}`}
          accessibilityRole="summary"
        >
          <Text className="text-4xl font-bold text-tPrimary" importantForAccessibility="no">
            € {balance.toFixed(2)}
          </Text>
          <Text className="text-tSecondary mt-1" importantForAccessibility="no">
            Balance
          </Text>
        </View>

        {/* Transaction List */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
