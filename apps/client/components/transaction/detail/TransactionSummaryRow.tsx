import { Text, View } from "react-native";
import { formatCurrency } from "@/lib/format";

type Props = {
  displayName: string;
  description: string | null;
  amount: number;
  isExpense: boolean;
};

export function TransactionSummaryRow({ displayName, description, amount, isExpense }: Props) {
  return (
    <View
      className="flex-row items-center px-4 py-4 bg-cards border-b border-border"
      accessibilityRole="summary"
      accessibilityLabel={`${displayName || description || "Unknown"}, ${isExpense ? "" : "+"}${formatCurrency(amount)}`}
    >
      <View className="w-10 h-10 rounded-full bg-accent items-center justify-center mr-3" />
      <View className="flex-1">
        <Text className="text-tPrimary text-base font-medium" numberOfLines={1}>
          {displayName || description || "Unknown"}
        </Text>
      </View>
      <Text className={`text-base font-semibold ${isExpense ? "text-tPrimary" : "text-primary"}`}>
        {isExpense ? "" : "+"}{formatCurrency(amount)}
      </Text>
    </View>
  );
}
