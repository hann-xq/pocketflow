import { View, Text } from "react-native";
import { Button, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import type { ApiBankAccount } from "@/lib/types";

type Props = {
  item: ApiBankAccount;
  isOnline: boolean;
  onEdit: (item: ApiBankAccount) => void;
  onDelete: (item: ApiBankAccount) => void;
  onConnectExternalConnection: (item: ApiBankAccount) => void;
  onRemoveExternalConnection: (item: ApiBankAccount) => void;
  onSyncExternalConnection: (item: ApiBankAccount) => void;
  isSyncing: boolean;
};

type AbnButtonProps = {
  label: string;
  icon: string;
  onPress: () => void;
  disabled: boolean;
  loading?: boolean;
  color?: string;
  accessibilityLabel: string;
  accessibilityHint: string;
};

const AbnButton = ({ label, icon, onPress, disabled, loading, color = colors.secondary, accessibilityLabel, accessibilityHint }: AbnButtonProps) => (
  <Button
    mode="text"
    compact
    onPress={onPress}
    disabled={disabled}
    loading={loading}
    icon={icon}
    buttonColor={color}
    textColor="#fff"
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
    accessibilityState={{ disabled }}
  >
    {label}
  </Button>
);

export function BankAccountItem({
  item,
  isOnline,
  onEdit,
  onDelete,
  onConnectExternalConnection,
  onRemoveExternalConnection,
  onSyncExternalConnection,
  isSyncing,
}: Props) {
  const isConnected = item.connectionType != null;

  const offlineHint = "Not available while offline.";

  return (
    <View
      className="px-4 py-3 bg-cards border-b border-border"
      accessibilityLabel={`${item.accountName}, ${item.accountNumber}`}
    >
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mr-3"
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        >
          <MaterialCommunityIcons name="bank-outline" size={24} color="#fff" />
        </View>

        <View className="flex-1">
          <Text className="text-tPrimary">{item.accountName}</Text>
          <Text className="text-tSecondary text-sm">{item.accountNumber}</Text>
        </View>

        <IconButton
          icon="pencil-outline"
          iconColor={colors.tSecondary}
          size={20}
          onPress={() => onEdit(item)}
          accessibilityLabel={`Edit ${item.accountName}`}
          accessibilityHint="Opens a form to rename this account."
        />

        <IconButton
          icon="trash-can-outline"
          iconColor="#EF4444"
          size={20}
          onPress={() => onDelete(item)}
          accessibilityLabel={`Delete ${item.accountName}`}
          accessibilityHint="Permanently removes this bank account."
        />
      </View>

      <View className="mt-1 ml-13 flex-row gap-2">
        {isConnected ? (
          <>
            <AbnButton
              label="Remove Connection"
              icon="link-variant-off"
              onPress={() => onRemoveExternalConnection(item)}
              disabled={!isOnline}
              color="#EF4444"
              accessibilityLabel={`Remove ABN AMRO connection for ${item.accountName}`}
              accessibilityHint={isOnline ? "Disconnects this account from ABN AMRO." : offlineHint}
            />
            <AbnButton
              label="Sync"
              icon="sync"
              onPress={() => onSyncExternalConnection(item)}
              disabled={isSyncing || !isOnline}
              loading={isSyncing}
              accessibilityLabel={`Sync transactions for ${item.accountName}`}
              accessibilityHint={!isOnline ? offlineHint : isSyncing ? "Sync already in progress." : "Imports the latest transactions from ABN AMRO."}
            />
          </>
        ) : (
          <AbnButton
            label="Connect ABN AMRO"
            icon="link-variant"
            onPress={() => onConnectExternalConnection(item)}
            disabled={!isOnline}
            accessibilityLabel={`Connect ${item.accountName} with ABN AMRO`}
            accessibilityHint={isOnline ? "Opens the ABN AMRO authorisation flow." : offlineHint}
          />
        )}
      </View>
    </View>
  );
}
