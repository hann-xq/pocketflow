import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useCategories } from "@/hooks/categories/useCategories";
import { useUpdateTransaction } from "@/hooks/transactions/useUpdateTransaction";
import type { ApiTransaction } from "@/lib/types";

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
}

export default function TransactionDetail() {
  const params = useLocalSearchParams<{ id: string; data: string }>();
  const initial: ApiTransaction = JSON.parse(params.data);

  const { data: transactions = [] } = useTransactions();
  const transaction = transactions.find((t) => t.id === initial.id) ?? initial;

  const updateTransaction = useUpdateTransaction();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAmount, setEditAmount] = useState(transaction.amount);
  const [editCounterpartyName, setEditCounterpartyName] = useState(transaction.counterpartyName ?? "");
  const [editCounterpartyAccount, setEditCounterpartyAccount] = useState(transaction.counterpartyAccount ?? "");

  const amount = parseFloat(transaction.amount);
  const isExpense = amount < 0;
  const displayName = transaction.counterpartyName ?? "";

  const handleCategorySelect = (categoryId: string) => {
    updateTransaction.mutate(
      { id: transaction.id, categoryId },
      { onSuccess: () => setPickerVisible(false) }
    );
  };

  const handleTransactionEdit = () => {
    updateTransaction.mutate(
      {
        id: transaction.id,
        amount: parseFloat(editAmount),
        counterpartyName: editCounterpartyName || null,
        counterpartyAccount: editCounterpartyAccount || null,
      },
      { onSuccess: () => setEditModalVisible(false) }
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-cards border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#94A3B8" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-tSecondary text-sm" numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <View className="w-9" />
        </View>

        {/* Transaction summary */}
        <View className="flex-row items-center px-4 py-4 bg-cards border-b border-border">
          <View className="w-10 h-10 rounded-full bg-accent items-center justify-center mr-3" />
          <View className="flex-1">
            <Text className="text-tPrimary text-base font-medium" numberOfLines={1}>
              {displayName || transaction.description || "Unknown"}
            </Text>
          </View>
          <Text className={`text-base font-semibold ${isExpense ? "text-tPrimary" : "text-primary"}`}>
            {isExpense ? "-" : "+"}€{Math.abs(amount).toFixed(2)}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Edit category section */}
          <View className="px-4 py-2 bg-background border-b border-border">
            <Text className="text-sm font-semibold text-tPrimary">Edit category</Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center px-4 py-4 bg-cards border-b border-border"
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Category: ${transaction.category?.name ?? "Uncategorized"}. Tap to edit.`}
          >
            <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
              <MaterialCommunityIcons name="tag-outline" size={20} color="#fff" />
            </View>
            <Text className="flex-1 text-tPrimary text-base">
              {transaction.category?.name ?? "Uncategorized"}
            </Text>
            <MaterialCommunityIcons name="pencil-outline" size={22} color="#38BDF8" />
          </TouchableOpacity>

          {/* Tags section */}
          <View className="px-4 py-2 bg-background border-b border-border mt-2">
            <Text className="text-sm font-semibold text-tPrimary">Tags</Text>
          </View>

          {transaction.tags.length > 0 && (
            <View className="px-4 py-4 bg-cards border-b border-border">
              <View className="flex-row flex-wrap gap-2">
                {transaction.tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    className="bg-accent px-3 py-1 rounded-full"
                    onPress={() => router.push({ pathname: "/transactions/by-tag", params: { tagId: tag.id, tagName: tag.name } })}
                    accessibilityRole="button"
                    accessibilityLabel={`View all transactions tagged ${tag.name}`}
                  >
                    <Text className="text-primary text-sm font-medium">#{tag.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            className="flex-row items-center px-4 py-4 bg-cards border-b border-border"
            onPress={() => router.push({ pathname: "/transactions/edit-tags", params: { transactionId: transaction.id } })}
            accessibilityRole="button"
            accessibilityLabel="Edit tags"
          >
            <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
              <MaterialCommunityIcons name="tag-multiple-outline" size={20} color="#fff" />
            </View>
            <Text className="flex-1 text-tPrimary text-base">Edit tags</Text>
            <MaterialCommunityIcons name="pencil-outline" size={22} color="#38BDF8" />
          </TouchableOpacity>

          {/* Transaction details section */}
          <View className="px-4 py-2 bg-background border-b border-border mt-2">
            <Text className="text-sm font-semibold text-tPrimary">Transaction details</Text>
          </View>

          <View className="px-4 py-4 bg-cards border-b border-border">
            <Text className="text-sm font-semibold text-tPrimary mb-1">Date</Text>
            <Text className="text-tSecondary text-sm">{formatDisplayDate(transaction.date)}</Text>
          </View>

          <View className="px-4 py-4 bg-cards border-b border-border">
            <Text className="text-sm font-semibold text-tPrimary mb-1">Counterparty</Text>
            <Text className="text-tSecondary text-sm">{transaction.counterpartyName}</Text>
            <Text className="text-tSecondary text-sm">{transaction.counterpartyAccount}</Text>
          </View>

          {transaction.description && (
            <View className="px-4 py-4 bg-cards border-b border-border">
              <Text className="text-sm font-semibold text-tPrimary mb-1">Description</Text>
              <Text className="text-tSecondary text-sm">{transaction.description}</Text>
            </View>
          )}

          <TouchableOpacity
            className="mx-4 mt-6 py-3 bg-primary rounded-xl items-center"
            onPress={() => {
              setEditAmount(transaction.amount);
              setEditCounterpartyName(transaction.counterpartyName ?? "");
              setEditCounterpartyAccount(transaction.counterpartyAccount ?? "");
              setEditModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit transaction"
          >
            <Text className="text-white font-semibold text-base">Edit transaction</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <Pressable
            className="flex-1 bg-black/50"
            onPress={() => setEditModalVisible(false)}
          />
          <View className="bg-cards rounded-t-2xl">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
              <Text className="text-tPrimary text-base font-semibold">Edit transaction</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View className="px-4 py-4 gap-4">
              <View>
                <Text className="text-sm font-semibold text-tPrimary mb-2">Amount</Text>
                <TextInput
                  className="bg-background text-tPrimary px-3 py-3 rounded-lg border border-border"
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="numeric"
                  placeholder="e.g. -12.50"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-tPrimary mb-2">Counterparty name</Text>
                <TextInput
                  className="bg-background text-tPrimary px-3 py-3 rounded-lg border border-border"
                  value={editCounterpartyName}
                  onChangeText={setEditCounterpartyName}
                  placeholder="Counterparty name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-tPrimary mb-2">Counterparty account</Text>
                <TextInput
                  className="bg-background text-tPrimary px-3 py-3 rounded-lg border border-border"
                  value={editCounterpartyAccount}
                  onChangeText={setEditCounterpartyAccount}
                  placeholder="e.g. BE68 5390 0754 7034"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <TouchableOpacity
                className="py-3 bg-primary rounded-xl items-center mt-2"
                onPress={handleTransactionEdit}
                disabled={updateTransaction.isPending}
                accessibilityRole="button"
              >
                {updateTransaction.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={pickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerVisible(false)}
        >
          <Pressable
            className="flex-1 bg-black/50"
            onPress={() => setPickerVisible(false)}
          />
          <View className="bg-cards rounded-t-2xl max-h-[60%]">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
              <Text className="text-tPrimary text-base font-semibold">Select category</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {loadingCategories ? (
              <View className="py-10 items-center">
                <ActivityIndicator color="#38BDF8" />
              </View>
            ) : (
              <ScrollView>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    className="flex-row items-center px-4 py-4 border-b border-border"
                    onPress={() => handleCategorySelect(cat.id)}
                    disabled={updateTransaction.isPending}
                  >
                    <Text className="flex-1 text-tPrimary text-base">{cat.name}</Text>
                    {transaction.category?.id === cat.id && (
                      <MaterialCommunityIcons name="check" size={20} color="#38BDF8" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {updateTransaction.isPending && (
              <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-t-2xl">
                <ActivityIndicator color="#38BDF8" />
              </View>
            )}
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
