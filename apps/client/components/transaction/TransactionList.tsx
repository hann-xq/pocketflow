import { memo, useCallback, useMemo } from "react";
import { SectionList, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { ApiTransaction } from "@/lib/types";
import { formatDisplayDate } from "@/lib/format";
import { TransactionItem } from "./TransactionItem";

type Section = { title: string; data: ApiTransaction[] };

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

export const TransactionList = memo(function TransactionList({
  transactions,
  onDelete,
  contentContainerStyle,
}: {
  transactions: ApiTransaction[];
  onDelete?: (id: string) => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const sections = useMemo(() => groupByDate(transactions), [transactions]);

  const renderItem = useCallback(
    ({ item }: { item: ApiTransaction }) => <TransactionItem item={item} onDelete={onDelete} />,
    [onDelete],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
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
    ),
    [],
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      contentContainerStyle={contentContainerStyle}
    />
  );
});
