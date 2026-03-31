import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ApiBankAccount } from "@/lib/types";

function BankAccountItem({ item }: { item: ApiBankAccount }) {
  return (
    <View
      className="flex-row items-center px-4 py-3 bg-cards border-b border-border"
      accessible={true}
      accessibilityLabel={`${item.accountName}, ${item.accountNumber}`}
    >
      <View className="w-10 h-10 rounded-full bg-accent items-center justify-center mr-3">
        <MaterialCommunityIcons name="bank-outline" size={20} color="#fff" />
      </View>
      <View className="flex-1">
        <Text className="text-tPrimary text-base">{item.accountName}</Text>
        <Text className="text-tSecondary text-xs">{item.accountNumber}</Text>
      </View>
    </View>
  );
}

export default function Profile() {
  const { userId, logout } = useAuth();

  const { data: bankAccounts = [], isLoading, error } = useQuery({
    queryKey: ["bank-accounts", userId],
    queryFn: () => api.get<ApiBankAccount[]>(`/users/${userId}/bank-accounts`),
    enabled: !!userId,
  });

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-background">
        <FlatList
          data={bankAccounts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BankAccountItem item={item} />}
          ListEmptyComponent={
            !isLoading && !error ? (
              <View className="items-center py-12">
                <MaterialCommunityIcons name="bank-off-outline" size={48} color="#64748B" />
                <Text className="text-tSecondary mt-4">No bank accounts found</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            error ? (
              <View className="items-center py-12 px-6">
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#64748B" />
                <Text className="text-tSecondary mt-4 text-center">
                  {error?.message ?? "Failed to load bank accounts"}
                </Text>
              </View>
            ) : isLoading ? (
              <View
                className="items-center py-12"
                accessible={true}
                accessibilityLiveRegion="polite"
                accessibilityLabel="Loading bank accounts"
              >
                <Text className="text-tSecondary">Loading bank accounts...</Text>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 96 }}
        />

        <TouchableOpacity
          onPress={logout}
          className="absolute bottom-6 left-6 right-6 py-3 bg-secondary rounded-lg items-center"
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text className="text-white font-semibold">Log Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
