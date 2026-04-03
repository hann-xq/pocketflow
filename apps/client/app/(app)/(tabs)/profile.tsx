import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import type { WebViewNavigation } from "react-native-webview";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useIsOnline } from "@/lib/network";
import type { BankAccountFormState, ExternalConnectionSession, ModalMode } from "@/lib/bank-account-utils";
import type { ApiBankAccount } from "@/lib/types";
import { validateIban } from "@/lib/validation";
import { useBankAccounts } from "@/hooks/bank-accounts/useBankAccounts";
import { useCreateBankAccount } from "@/hooks/bank-accounts/useCreateBankAccount";
import { useUpdateBankAccount } from "@/hooks/bank-accounts/useUpdateBankAccount";
import { useDeleteBankAccount } from "@/hooks/bank-accounts/useDeleteBankAccount";
import { AbnAmroWebViewModal } from "@/components/profile/AbnAmroWebViewModal";
import { BankAccountFormModal } from "@/components/profile/BankAccountFormModal";
import { BankAccountItem } from "@/components/BankAccountItem";

function getErrorMessage(err: unknown, action: string): string {
  const e = err as { status?: number; message?: string };
  if (e?.status === 400) {
    const msg = Array.isArray(e.message) ? e.message.join("\n") : e.message;
    return msg ?? "Invalid account details. Please check your input.";
  }
  if (e?.status === 404) return "Bank account not found.";
  if (e?.status === 409) return "A bank account with this IBAN already exists.";
  return `Failed to ${action} bank account. Please try again.`;
}

export default function Profile() {
  const { userId, logout } = useAuth();
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();

  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [form, setForm] = useState<BankAccountFormState>({ accountName: "", accountNumber: "" });
  const [ibanError, setIbanError] = useState<string | null>(null);

  const [abnAmroSession, setAbnAmroSession] = useState<ExternalConnectionSession | null>(null);
  const [isLoadingAuthUrl, setIsLoadingAuthUrl] = useState(false);
  const [isExchangingCode, setIsExchangingCode] = useState(false);

  const { data: bankAccounts = [], isLoading, error } = useBankAccounts();
  const createBankAccount = useCreateBankAccount();
  const updateBankAccount = useUpdateBankAccount();
  const deleteBankAccount = useDeleteBankAccount();

  const removeAbnAmroMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bank-accounts/${id}/abn-amro/connection`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts", userId] });
      Alert.alert("Success", "ABN AMRO connection removed.");
    },
    onError: (err) => {
      const e = err as { message?: string };
      Alert.alert("Error", e?.message ?? "Failed to remove ABN AMRO connection.");
    },
  });

  const syncAbnAmroMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{ imported: number; skipped: number }>(`/bank-accounts/${id}/abn-amro/transactions`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts", userId] });
      Alert.alert("Sync complete", `Imported: ${data.imported}, skipped: ${data.skipped}`);
    },
    onError: (err) => {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401) {
        Alert.alert("Error", "Not authorized. Please reconnect ABN AMRO.");
      } else {
        Alert.alert("Error", e?.message ?? "Failed to sync transactions.");
      }
    },
  });

  async function handleConnectAbnAmro(item: ApiBankAccount) {
    setIsLoadingAuthUrl(true);
    try {
      const { authorizationUrl } = await api.get<{ authorizationUrl: string }>(
        `/bank-accounts/${item.id}/abn-amro/authorization`
      );
      setAbnAmroSession({ authorizationUrl, accountId: item.id });
    } catch (err) {
      const e = err as { message?: string };
      Alert.alert("Error", e?.message ?? "Failed to start ABN AMRO connection. Please try again.");
    } finally {
      setIsLoadingAuthUrl(false);
    }
  }

  function handleWebViewNavigation(navState: WebViewNavigation): boolean {
    if (!abnAmroSession || !navState.url.startsWith("https://localhost")) {
      return true;
    }

    const url = new URL(navState.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      setAbnAmroSession(null);
      Alert.alert("Error", "ABN AMRO did not return an authorization code.");
      return false;
    }

    setIsExchangingCode(true);
    api
      .abnAmroAuthCallback(code, state)
      .then(() => {
        setAbnAmroSession(null);
        queryClient.invalidateQueries({ queryKey: ["bank-accounts", userId] });
        Alert.alert("Success", "ABN AMRO account connected successfully.");
      })
      .catch((err) => {
        setAbnAmroSession(null);
        const e = err as { status?: number; message?: string };
        if (e?.status === 400) {
          Alert.alert("Error", "Invalid or missing authorization code.");
        } else if (e?.status === 401) {
          Alert.alert("Error", "Authorization session expired. Please try again.");
        } else {
          Alert.alert("Error", e?.message ?? "Failed to complete ABN AMRO connection.");
        }
      })
      .finally(() => setIsExchangingCode(false));

    return false;
  }

  function openCreate() {
    setForm({ accountName: "", accountNumber: "" });
    setIbanError(null);
    setModalMode({ type: "create" });
  }

  function openEdit(account: ApiBankAccount) {
    setForm({ accountName: account.accountName, accountNumber: account.accountNumber });
    setIbanError(null);
    setModalMode({ type: "edit", account });
  }

  function handleDelete(account: ApiBankAccount) {
    Alert.alert(
      "Delete Bank Account",
      `Are you sure you want to delete "${account.accountName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteBankAccount.mutate(account.id, {
              onSuccess: () => Alert.alert("Success", "Bank account deleted successfully."),
              onError: (err) => Alert.alert("Error", getErrorMessage(err, "delete")),
            }),
        },
      ]
    );
  }

  function handleRemoveAbnAmro(account: ApiBankAccount) {
    Alert.alert(
      "Remove ABN AMRO Connection",
      `Remove ABN AMRO connection for "${account.accountName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeAbnAmroMutation.mutate(account.id),
        },
      ]
    );
  }

  function handleSubmit() {
    if (modalMode?.type === "create") {
      const ibanValidationError = validateIban(form.accountNumber);
      if (ibanValidationError) {
        setIbanError(ibanValidationError);
        return;
      }
      setIbanError(null);
      createBankAccount.mutate(form, {
        onSuccess: () => {
          setModalMode(null);
          Alert.alert("Success", "Bank account created successfully.");
        },
        onError: (err) => Alert.alert("Error", getErrorMessage(err, "create")),
      });
    } else if (modalMode?.type === "edit") {
      updateBankAccount.mutate(
        { id: modalMode.account.id, accountName: form.accountName },
        {
          onSuccess: () => {
            setModalMode(null);
            Alert.alert("Success", "Bank account updated successfully.");
          },
          onError: (err) => Alert.alert("Error", getErrorMessage(err, "update")),
        }
      );
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-background">
        <FlatList
          data={bankAccounts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BankAccountItem
              item={item}
              isOnline={isOnline}
              onEdit={openEdit}
              onDelete={handleDelete}
              onConnectExternalConnection={handleConnectAbnAmro}
              onRemoveExternalConnection={handleRemoveAbnAmro}
              onSyncExternalConnection={(account) => syncAbnAmroMutation.mutate(account.id)}
              isSyncing={syncAbnAmroMutation.isPending && syncAbnAmroMutation.variables === item.id}
            />
          )}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-tPrimary text-lg font-semibold">Bank Accounts</Text>
              <TouchableOpacity
                onPress={openCreate}
                className="w-9 h-9 rounded-full bg-accent items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Add bank account"
              >
                <MaterialCommunityIcons name="plus" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          }
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

        <TouchableOpacity
          onPress={logout}
          className="absolute bottom-6 left-6 right-6 py-3 bg-secondary rounded-lg items-center"
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text className="text-white font-semibold">Log Out</Text>
        </TouchableOpacity>

        <AbnAmroWebViewModal
          session={abnAmroSession}
          isLoadingAuthUrl={isLoadingAuthUrl}
          isExchangingCode={isExchangingCode}
          onClose={() => setAbnAmroSession(null)}
          onNavigation={handleWebViewNavigation}
        />

        <BankAccountFormModal
          mode={modalMode}
          form={form}
          onChangeForm={(update) => setForm((f) => ({ ...f, ...update }))}
          ibanError={ibanError}
          onClearIbanError={() => setIbanError(null)}
          onClose={() => setModalMode(null)}
          onSubmit={handleSubmit}
          isSubmitting={createBankAccount.isPending || updateBankAccount.isPending}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
