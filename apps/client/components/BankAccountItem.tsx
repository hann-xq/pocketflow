import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ApiBankAccount } from "@/lib/types";

type Props = {
  item: ApiBankAccount;
  onEdit: (item: ApiBankAccount) => void;
  onDelete: (item: ApiBankAccount) => void;
  onConnectExternalConnection: (item: ApiBankAccount) => void;
  onRemoveExternalConnection: (item: ApiBankAccount) => void;
  onSyncExternalConnection: (item: ApiBankAccount) => void;
  isSyncing: boolean;
};

export function BankAccountItem({
  item,
  onEdit,
  onDelete,
  onConnectExternalConnection,
  onRemoveExternalConnection,
  onSyncExternalConnection,
  isSyncing,
}: Props) {
  const isConnected = item.connectionType != null;

  return (
    <View
      className="px-4 py-3 bg-cards border-b border-border"
      accessible={true}
      accessibilityLabel={`${item.accountName}, ${item.accountNumber}`}
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-accent items-center justify-center mr-3">
          <MaterialCommunityIcons name="bank-outline" size={20} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-tPrimary text-base">{item.accountName}</Text>
          <Text className="text-tSecondary text-xs">{item.accountNumber}</Text>
        </View>
        <TouchableOpacity
          onPress={() => onEdit(item)}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel={`Edit ${item.accountName}`}
        >
          <MaterialCommunityIcons name="pencil-outline" size={20} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(item)}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.accountName}`}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <View className="mt-2 ml-13 flex-row gap-2">
        {isConnected ? (
          <>
            <TouchableOpacity
              onPress={() => onRemoveExternalConnection(item)}
              className="flex-row items-center gap-1 self-start px-3 py-1.5 rounded-md bg-secondary"
              accessibilityRole="button"
              accessibilityLabel={`Remove ABN AMRO connection for ${item.accountName}`}
            >
              <MaterialCommunityIcons name="link-variant-off" size={14} color="#fff" />
              <Text className="text-white text-xs font-medium">Remove Connection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSyncExternalConnection(item)}
              disabled={isSyncing}
              className={`flex-row items-center gap-1 self-start px-3 py-1.5 rounded-md ${isSyncing ? "bg-accent/50" : "bg-accent"}`}
              accessibilityRole="button"
              accessibilityLabel={`Sync transactions for ${item.accountName}`}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#fff" style={{ width: 14, height: 14 }} />
              ) : (
                <MaterialCommunityIcons name="sync" size={14} color="#fff" />
              )}
              <Text className="text-white text-xs font-medium">Sync</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={() => onConnectExternalConnection(item)}
            className="flex-row items-center gap-1 self-start px-3 py-1.5 rounded-md bg-accent"
            accessibilityRole="button"
            accessibilityLabel={`Connect ${item.accountName} with ABN AMRO`}
          >
            <MaterialCommunityIcons name="link-variant" size={14} color="#fff" />
            <Text className="text-white text-xs font-medium">Connect ABN AMRO</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
