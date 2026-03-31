import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useState, useMemo, useCallback } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ApiTransaction } from "@/lib/types";

type Tab = "recurring" | "spendings" | "income";

const CATEGORY_STYLES: Record<string, { bgColor: string; iconColor: string; icon: string }> = {
  groceries: { bgColor: "#FEE2E2", iconColor: "#EF4444", icon: "cart-outline" },
  transport: { bgColor: "#CFFAFE", iconColor: "#0891B2", icon: "navigation-variant-outline" },
  housing: { bgColor: "#D1FAE5", iconColor: "#059669", icon: "home-outline" },
  entertainment: { bgColor: "#FCE7F3", iconColor: "#BE185D", icon: "movie-open-outline" },
  uncategorized: { bgColor: "#F1F5F9", iconColor: "#94A3B8", icon: "tag-outline" },
};

function getCategoryStyle(name: string) {
  const key = name.toLowerCase().replace(/\s+/g, "");
  for (const slug of Object.keys(CATEGORY_STYLES)) {
    if (key.includes(slug)) return CATEGORY_STYLES[slug];
  }
  return CATEGORY_STYLES.uncategorized;
}

function getLastMonths(n: number) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({
      key,
      label: d.toLocaleString("en-US", { month: "short" }),
      isCurrent: i === 0,
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

const MAX_BAR_HEIGHT = 120;

export default function Insights() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("spendings");

  const {
    data: transactions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.get<ApiTransaction[]>(`/users/${userId}/transactions`),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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
      const total = monthTxs.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      return { ...m, total };
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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-tSecondary">Loading insights...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#64748B" />
        <Text className="text-tSecondary mt-4 text-center">{error?.message ?? "Failed to load data"}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-background">
        {/* Tab Bar */}
        <View className="flex-row bg-cards border-b border-border">
          {(["spendings", "income"] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 items-center py-4"
            >
              <Text
                className={`text-base font-semibold ${activeTab === tab ? "text-primary" : "text-tSecondary"}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && (
                <View className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary rounded-full" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            <>
              {/* Total & Period */}
              <View className="items-center pt-8 pb-2">
                <Text className="text-5xl font-bold text-tPrimary">€{total.toFixed(2)}</Text>
              </View>

              {/* Bar Chart */}
              <View className="flex-row items-end justify-around px-6 pt-4 pb-6">
                {monthlyData.map((m) => {
                  const barHeight =
                    m.total > 0 ? Math.max(10, (m.total / maxMonthly) * MAX_BAR_HEIGHT) : 10;
                  return (
                    <View key={m.key} className="items-center" style={{ flex: 1, marginHorizontal: 4 }}>
                      <Text
                        className="text-xs text-tSecondary mb-1"
                        numberOfLines={1}
                        style={{ fontSize: 10 }}
                      >
                        €{m.total >= 1000 ? `${(m.total / 1000).toFixed(1)}k` : m.total.toFixed(0)}
                      </Text>
                      <View
                        style={{
                          height: barHeight,
                          backgroundColor: m.isCurrent ? "#257D71" : "#1E3A5F",
                          borderRadius: 8,
                          width: "100%",
                          opacity: m.total === 0 ? 0.25 : 1,
                        }}
                      />
                      <Text className="text-tSecondary mt-1" style={{ fontSize: 12 }}>
                        {m.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Category Section Header */}
              <View className="flex-row items-center justify-between px-4 mb-3">
                <View className="bg-cards rounded-full px-5 py-2 border border-border shadow-sm">
                  <Text className="text-tPrimary font-semibold text-base">
                    {activeTab === "spendings" ? "Your spendings" : "Your income"}
                  </Text>
                </View>
              </View>

              {/* Category List */}
                <View className="px-4">
                  {categoryData.map((cat) => {
                    const style = getCategoryStyle(cat.name);
                    const pct = total > 0 ? Math.round((cat.total / total) * 100) : 0;
                    return (
                      <TouchableOpacity
                        key={cat.name}
                        onPress={() =>
                          router.push({
                            pathname: "/insights/[category]",
                            params: { category: cat.id, categoryId: cat.id, categoryName: cat.name, type: activeTab },
                          })
                        }
                        className="flex-row items-center bg-cards rounded-2xl px-4 py-4 border border-border mb-2"
                      >
                        {/* Category Icon */}
                        <View
                          style={{ backgroundColor: style.bgColor }}
                          className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        >
                          <MaterialCommunityIcons
                            name={style.icon as any}
                            size={22}
                            color={style.iconColor}
                          />
                        </View>

                        {/* Name & Count */}
                        <View className="flex-1 mr-3">
                          <Text className="text-tPrimary font-semibold text-base" numberOfLines={1}>
                            {cat.name}
                          </Text>
                          <Text className="text-tSecondary text-xs mt-0.5">
                            {cat.count} {cat.count === 1 ? "transaction" : "transactions"}
                          </Text>

                          {/* Progress bar */}
                          <View className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                            <View
                              style={{
                                width: `${pct}%`,
                                backgroundColor: style.iconColor,
                                height: "100%",
                                borderRadius: 999,
                              }}
                            />
                          </View>
                        </View>

                        {/* Amount & Percentage */}
                        <View className="items-end">
                          <Text className="text-tPrimary font-semibold text-base">
                            €{cat.total.toFixed(2)}
                          </Text>
                          <Text className="text-tSecondary text-xs mt-0.5">{pct}%</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
            </>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
