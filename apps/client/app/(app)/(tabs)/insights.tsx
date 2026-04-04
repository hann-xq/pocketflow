import { MaterialCommunityIcons } from "@expo/vector-icons";
import { onlineManager } from "@tanstack/react-query";
import { Button } from "react-native-paper";
import { useState, useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useInsightsShare } from "@/hooks/insights/useInsightsShare";
import { colors } from "@/lib/theme";
import { formatCurrency } from "@/lib/format";
import type { ApiTransaction } from "@/lib/types";
import { CategoryItem } from "@/components/insights/CategoryItem";
import { InsightsTabBar, type Tab } from "@/components/insights/InsightsTabBar";
import { MonthlyBarChart, type MonthData } from "@/components/insights/MonthlyBarChart";

function getLastMonths(n: number): MonthData[] {
  const result: MonthData[] = [];
  const now = new Date();

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({
      key,
      label: d.toLocaleString("en-US", { month: "short" }),
      isCurrent: i === 0,
      total: 0,
    });
  }

  return result;
}

function filterLast30Days(transactions: ApiTransaction[]): ApiTransaction[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  cutoff.setHours(0, 0, 0, 0);
  return transactions.filter((t) => new Date(t.date) >= cutoff);
}

export default function Insights() {
  const [activeTab, setActiveTab] = useState<Tab>("spendings");

  const { data: transactions = [], isLoading, error, refetch } = useTransactions();

  const months = useMemo(() => getLastMonths(4), []);
  const periodTransactions = useMemo(() => filterLast30Days(transactions), [transactions]);

  const tabTransactions = useMemo(() => {
    if (activeTab === "spendings") return periodTransactions.filter((t) => parseFloat(t.amount) < 0);
    if (activeTab === "income") return periodTransactions.filter((t) => parseFloat(t.amount) > 0);
    return [];
  }, [periodTransactions, activeTab]);

  const total = useMemo(
    () => tabTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0),
    [tabTransactions]
  );

  const monthlyData = useMemo(() => {
    return months.map((m) => {
      const isExpenseTab = activeTab !== "income";
      const monthTxs = transactions.filter((t) => {
        const amount = parseFloat(t.amount);
        return t.date.startsWith(m.key) && (isExpenseTab ? amount < 0 : amount > 0);
      });

      const monthTotal = monthTxs.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      return { ...m, total: monthTotal };
    });
  }, [transactions, months, activeTab]);

  const maxMonthly = useMemo(() => Math.max(...monthlyData.map((m) => m.total), 1), [monthlyData]);

  const categoryData = useMemo(() => {
    const map: Record<string, { id: string; name: string; count: number; total: number }> = {};

    for (const t of tabTransactions) {
      const key = t.category?.id ?? "uncategorized";
      const name = t.category?.name ?? "Uncategorized";
      if (!map[key]) map[key] = { id: key, name, count: 0, total: 0 };
      map[key].count += 1;
      map[key].total += Math.abs(parseFloat(t.amount));
    }

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [tabTransactions]);

  const handleShare = useInsightsShare(activeTab, total, categoryData);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-tSecondary">Loading insights...</Text>
      </View>
    );
  }

  if (error && (onlineManager.isOnline() || transactions.length === 0)) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.tSecondary} />
        <Text className="text-tSecondary mt-4 text-center">{error?.message ?? "Failed to load data"}</Text>
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
      <InsightsTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="items-center pt-8 pb-2">
          <Text className="text-5xl font-bold text-tPrimary">{formatCurrency(total)}</Text>
        </View>

        <MonthlyBarChart data={monthlyData} max={maxMonthly} />

        <View className="flex-row items-center justify-between px-4 mb-3">
          <View className="px-5 py-2">
            <Text className="text-tPrimary text-xl font-semibold">
              {activeTab === "spendings" ? "Your spendings" : "Your income"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleShare}
            className="px-5 py-2"
            accessibilityRole="button"
            accessibilityLabel="Share insights"
            accessibilityHint="Share a summary of this month's finances"
          >
            <MaterialCommunityIcons name="share-variant" size={22} color={colors.tSecondary} />
          </TouchableOpacity>
        </View>

        <View className="px-4">
          {categoryData.map((cat) => (
            <CategoryItem key={cat.name} category={cat} total={total} activeTab={activeTab} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
