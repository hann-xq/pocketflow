import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ApiBankAccount } from "@/lib/types";

type BankAccountFormState = {
  accountName: string;
  accountNumber: string;
};

type ModalMode = { type: "create" } | { type: "edit"; account: ApiBankAccount };

// 2-letter country code + 2-digit check number + 4-char bank code + 10-digit account number
const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z]{4}\d{10}$/;

function validateIban(value: string): string | null {
  const iban = value.replace(/\s/g, "");
  if (!iban) return "Account number is required.";
  if (!/^[A-Z]{2}/.test(iban)) return "IBAN must start with a 2-letter country code (e.g. NL).";
  if (!/^[A-Z]{2}\d{2}/.test(iban)) return "Country code must be followed by 2 check digits.";
  if (!IBAN_REGEX.test(iban))
    return "Invalid IBAN format. Expected: 2-letter country code, 2 check digits, 4-letter bank code, 10-digit account number.";
  return null;
}

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

function BankAccountItem({
  item,
  onEdit,
  onDelete,
}: {
  item: ApiBankAccount;
  onEdit: (item: ApiBankAccount) => void;
  onDelete: (item: ApiBankAccount) => void;
}) {
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
  );
}

export default function Profile() {
  const { userId, logout } = useAuth();
  const queryClient = useQueryClient();

  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [form, setForm] = useState<BankAccountFormState>({ accountName: "", accountNumber: "" });
  const [ibanError, setIbanError] = useState<string | null>(null);

  const { data: bankAccounts = [], isLoading, error } = useQuery({
    queryKey: ["bank-accounts", userId],
    queryFn: () => api.get<ApiBankAccount[]>(`/users/${userId}/bank-accounts`),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (data: BankAccountFormState) =>
      api.post(`/users/${userId}/bank-accounts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts", userId] });
      setModalMode(null);
      Alert.alert("Success", "Bank account created successfully.");
    },
    onError: (err) => {
      Alert.alert("Error", getErrorMessage(err, "create"));
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, accountName }: { id: string; accountName: string }) =>
      api.patch(`/bank-accounts/${id}`, { accountName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts", userId] });
      setModalMode(null);
      Alert.alert("Success", "Bank account updated successfully.");
    },
    onError: (err) => {
      Alert.alert("Error", getErrorMessage(err, "update"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bank-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts", userId] });
      Alert.alert("Success", "Bank account deleted successfully.");
    },
    onError: (err) => {
      Alert.alert("Error", getErrorMessage(err, "delete"));
    },
  });

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
          onPress: () => deleteMutation.mutate(account.id),
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
      createMutation.mutate(form);
    } else if (modalMode?.type === "edit") {
      editMutation.mutate({ id: modalMode.account.id, accountName: form.accountName });
    }
  }

  const isSubmitting = createMutation.isPending || editMutation.isPending;
  const isCreate = modalMode?.type === "create";

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-background">
        <FlatList
          data={bankAccounts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BankAccountItem item={item} onEdit={openEdit} onDelete={handleDelete} />
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

        <Modal
          visible={modalMode !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalMode(null)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-background rounded-t-2xl px-6 pt-6 pb-10">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-tPrimary text-xl font-semibold">
                  {isCreate ? "New Bank Account" : "Edit Bank Account"}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalMode(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text className="text-tSecondary text-sm mb-1">Account Name</Text>
              <TextInput
                className="bg-cards border border-border rounded-lg px-4 py-3 text-tPrimary mb-4"
                value={form.accountName}
                onChangeText={(v) => setForm((f) => ({ ...f, accountName: v }))}
                placeholder="My Checking Account"
                placeholderTextColor="#64748B"
                autoCapitalize="words"
              />

              {isCreate && (
                <>
                  <Text className="text-tSecondary text-sm mb-1">Account Number (IBAN)</Text>
                  <TextInput
                    className={`bg-cards border rounded-lg px-4 py-3 text-tPrimary ${ibanError ? "border-red-500 mb-1" : "border-border mb-6"}`}
                    value={form.accountNumber}
                    onChangeText={(v) => {
                      setForm((f) => ({ ...f, accountNumber: v.toUpperCase() }));
                      setIbanError(null);
                    }}
                    placeholder="NL91ABNA0417164300"
                    placeholderTextColor="#64748B"
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  {ibanError && (
                    <Text className="text-red-500 text-xs mb-6" accessibilityRole="alert">
                      {ibanError}
                    </Text>
                  )}
                </>
              )}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className={`py-3 rounded-lg items-center mt-2 ${isSubmitting ? "bg-accent/50" : "bg-accent"}`}
                accessibilityRole="button"
                accessibilityLabel={isCreate ? "Create bank account" : "Save changes"}
              >
                <Text className="text-white font-semibold">
                  {isSubmitting ? "Saving..." : isCreate ? "Create Account" : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
