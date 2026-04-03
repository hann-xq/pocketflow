import { memo, useRef } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ReanimatedSwipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import type { ApiTransaction } from "@/lib/types";
import { getCategoryStyle } from "@/components/insights/CategoryItem";

function parseAmount(amount: string): number {
  return parseFloat(amount);
}

export const TransactionItem = memo(function TransactionItem({
  item,
  onDelete,
}: {
  item: ApiTransaction;
  onDelete?: (id: string) => void;
}) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const displayTitle = item.counterpartyName?.trim() || "Unknown";
  const amount = parseAmount(item.amount);

  const isExpense = amount < 0;
  const deleteLabel = item.counterpartyName ?? `${isExpense ? "Expense" : "Income"} for €${Math.abs(amount).toFixed(2)}`;
  const categoryStyle = getCategoryStyle(item.category?.name ?? "");

  const inner = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: "/transactions/[id]", params: { id: item.id, data: JSON.stringify(item) } })}
      accessibilityRole="button"
      accessibilityLabel={`${displayTitle}, ${isExpense ? "-" : "+"}€${Math.abs(amount).toFixed(2)}`}
      accessibilityHint="Opens transaction details"
    >
      <View className="flex-row items-center px-4 py-3 bg-cards border-b border-border">
        <View
          className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isExpense ? "bg-slate-100" : "bg-emerald-100"}`}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        >
          <MaterialCommunityIcons
            name={categoryStyle.icon as any}
            size={20}
            color={categoryStyle.iconColor}
          />
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-tPrimary text-base" numberOfLines={1}>
            {displayTitle}
          </Text>
          <Text className="text-tSecondary text-xs" numberOfLines={1}>
            {item.category.name}
          </Text>
        </View>
        <Text className={`text-base font-semibold ${isExpense ? "text-tPrimary" : "text-primary"}`}>
          {isExpense ? "-" : "+"}€{Math.abs(amount).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!onDelete) {
    return inner;
  }

  const renderRightActions = () => (
    <View className="bg-red-500 justify-center items-center w-20">
      <MaterialCommunityIcons name="trash-can-outline" size={24} color="#fff" />
    </View>
  );

  const handleSwipeOpen = () => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete "${deleteLabel}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(item.id),
        },
      ]
    );
  };

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      rightThreshold={40}
    >
      {inner}
    </ReanimatedSwipeable>
  );
});
