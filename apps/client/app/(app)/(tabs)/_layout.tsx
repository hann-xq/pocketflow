import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          headerShown: false,
          tabBarAccessibilityLabel: 'Insights tab',
          tabBarIcon: () => (
            <FontAwesome name="pie-chart" importantForAccessibility="no" accessibilityElementsHidden={true} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          headerShown: false,
          tabBarAccessibilityLabel: 'Transactions tab',
          tabBarIcon: () => (
            <FontAwesome name="list" importantForAccessibility="no" accessibilityElementsHidden={true} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarIcon: () => (
            <MaterialCommunityIcons name="account" importantForAccessibility="no" accessibilityElementsHidden={true} />
          ),
        }}
      />
    </Tabs>
  );
}
