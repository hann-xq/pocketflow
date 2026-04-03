import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlatList, Text, View } from "react-native";
import { IconButton } from "react-native-paper";
import { colors } from "@/lib/theme";
import { BankAccountItem } from "@/components/BankAccountItem";
import type { ApiBankAccount } from "@/lib/types";

type Props = {
  bankAccounts: ApiBankAccount[];
  isLoading: boolean;
  isOnline: boolean;
  error: Error | null;
  syncingAccountId: string | undefined;
  onAdd: () => void;
  onEdit: (account: ApiBankAccount) => void;
  onDelete: (account: ApiBankAccount) => void;
  onConnectExternalConnection: (account: ApiBankAccount) => void;
  onRemoveExternalConnection: (account: ApiBankAccount) => void;
  onSyncExternalConnection: (account: ApiBankAccount) => void;
};

export function BankAccountList({
  bankAccounts,
  isLoading,
  isOnline,
  error,
  syncingAccountId,
  onAdd,
  onEdit,
  onDelete,
  onConnectExternalConnection,
  onRemoveExternalConnection,
  onSyncExternalConnection,
}: Props) {
  return (
    <FlatList
      data={bankAccounts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <BankAccountItem
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onConnectExternalConnection={onConnectExternalConnection}
          onRemoveExternalConnection={onRemoveExternalConnection}
          onSyncExternalConnection={onSyncExternalConnection}
          isSyncing={syncingAccountId === item.id}
          isOnline={isOnline}
        />
      )}
      ListHeaderComponent={
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="font-semibold" style={{ fontSize: 22 }} accessibilityRole="header">Bank Accounts</Text>
          <IconButton
            icon="plus"
            size={20}
            iconColor="#fff"
            containerColor={colors.secondary}
            onPress={onAdd}
            accessibilityLabel="Add bank account"
            style={{ margin: 0 }}
          />
        </View>
      }
      ListEmptyComponent={
        !isLoading && !error ? (
          <View className="items-center py-12">
            <MaterialCommunityIcons name="bank-off-outline" size={48} color={colors.tSecondary} />
            <Text className="text-tSecondary mt-4">No bank accounts found</Text>
          </View>
        ) : null
      }
      ListFooterComponent={
        error ? (
          <View className="items-center py-12 px-6">
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.tSecondary} />
            <Text className="text-tSecondary mt-4 text-center">
              {(error as { message?: string })?.message ?? "Failed to load bank accounts"}
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
  );
}
