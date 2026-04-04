import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { formatCurrency } from "@/lib/format";
import type { Tab } from "./InsightsTabBar";

export const CATEGORY_STYLES: Record<string, { bgColor: string; iconColor: string; icon: string }> = {
  groceries: { bgColor: "#FEE2E2", iconColor: "#EF4444", icon: "cart-outline" },
  transport: { bgColor: "#CFFAFE", iconColor: "#0891B2", icon: "navigation-variant-outline" },
  housing: { bgColor: "#D1FAE5", iconColor: "#059669", icon: "home-outline" },
  entertainment: { bgColor: "#FCE7F3", iconColor: "#BE185D", icon: "movie-open-outline" },
  uncategorized: { bgColor: "#F1F5F9", iconColor: "#94A3B8", icon: "tag-outline" },
};

export function getCategoryStyle(name: string) {
  const key = name.toLowerCase().replace(/\s+/g, "");
  for (const slug of Object.keys(CATEGORY_STYLES)) {
    if (key.includes(slug)) return CATEGORY_STYLES[slug];
  }
  return CATEGORY_STYLES.uncategorized;
}

export type CategoryData = {
  id: string;
  name: string;
  count: number;
  total: number;
};

type Props = {
  category: CategoryData;
  total: number;
  activeTab: Tab;
};

export function CategoryItem({ category, total, activeTab }: Props) {
  const style = getCategoryStyle(category.name);
  const pct = total > 0 ? Math.round((category.total / total) * 100) : 0;

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/insights/[category]",
          params: {
            category: category.id,
            categoryId: category.id,
            categoryName: category.name,
            type: activeTab,
          },
        })
      }
      className="flex-row items-center bg-cards rounded-2xl px-4 py-4 border border-border mb-2"
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, ${formatCurrency(category.total)}, ${pct}%`}
      accessibilityHint="View transactions in this category"
    >
      <View
        style={{ backgroundColor: style.bgColor }}
        className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <MaterialCommunityIcons name={style.icon as any} size={22} color={style.iconColor} />
      </View>

      <View className="flex-1 mr-3">
        <Text className="text-tPrimary font-semibold text-base" numberOfLines={1}>
          {category.name}
        </Text>
        <Text className="text-tSecondary text-xs mt-0.5">
          {category.count} {category.count === 1 ? "transaction" : "transactions"}
        </Text>

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

      <View className="items-end">
        <Text className="text-tPrimary font-semibold text-base">{formatCurrency(category.total)}</Text>
        <Text className="text-tSecondary text-xs mt-0.5">{pct}%</Text>
      </View>
    </TouchableOpacity>
  );
}
