import { Text, View } from "react-native";

const MAX_BAR_HEIGHT = 120;

export type MonthData = {
  key: string;
  label: string;
  isCurrent: boolean;
  total: number;
};

type Props = {
  data: MonthData[];
  max: number;
};

function formatAmount(total: number): string {
  return total.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function MonthlyBarChart({ data, max }: Props) {
  return (
    <View className="flex-row items-end justify-around px-6 pt-4 pb-6">
      {data.map((m) => {
        const barHeight = m.total > 0 ? Math.max(10, (m.total / max) * MAX_BAR_HEIGHT) : 10;
        return (
          <View
            key={m.key}
            accessible
            accessibilityLabel={`${m.label}: €${formatAmount(m.total)}`}
            className="items-center"
            style={{ flex: 1, marginHorizontal: 4 }}
          >
            <Text
              className="text-xs text-tSecondary mb-1"
              numberOfLines={1}
              style={{ fontSize: 10 }}
            >
              €{formatAmount(m.total)}
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
  );
}
