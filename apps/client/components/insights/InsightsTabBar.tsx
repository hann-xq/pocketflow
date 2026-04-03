import { Text, TouchableOpacity, View } from "react-native";

export type Tab = "recurring" | "spendings" | "income";

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export function InsightsTabBar({ activeTab, onTabChange }: Props) {
  return (
    <View className="flex-row bg-cards border-b border-border">
      {(["spendings", "income"] as Tab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onTabChange(tab)}
          className="flex-1 items-center py-4"
          accessibilityRole="tab"
          accessibilityLabel={`${tab.charAt(0).toUpperCase() + tab.slice(1)} tab`}
          accessibilityState={{ selected: activeTab === tab }}
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
  );
}
