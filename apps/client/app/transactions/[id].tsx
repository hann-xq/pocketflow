import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
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
import "../global.css";
import { api } from "@/lib/api";
import type { ApiTransaction } from "@/lib/types";

type ApiCategory = {
  id: string;
  name: string;
  description: string;
};

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
}

export default function TransactionDetail() {
  const params = useLocalSearchParams<{ data: string }>();
  const transaction: ApiTransaction = JSON.parse(params.data);

  const queryClient = useQueryClient();

  const [currentCategory, setCurrentCategory] = useState(transaction.category);
  const [currentAmount, setCurrentAmount] = useState(transaction.amount);
  const [currentTags, setCurrentTags] = useState(transaction.tags);

  useFocusEffect(
    useCallback(() => {
      api.get<ApiTransaction>(`/transactions/${transaction.id}`).then((data) => {
        setCurrentTags(data.tags);
      }).catch(() => {});
    }, [transaction.id])
  );

  const amount = parseFloat(currentAmount);
  const isExpense = amount < 0;
  const [currentCounterpartyName, setCurrentCounterpartyName] = useState(transaction.counterpartyName);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAmount, setEditAmount] = useState(transaction.amount);
  const [editCounterpartyName, setEditCounterpartyName] = useState(transaction.counterpartyName);
  const [editCounterpartyAccount, setEditCounterpartyAccount] = useState(transaction.counterpartyAccount);
  const [currentCounterpartyAccount, setCurrentCounterpartyAccount] = useState(transaction.counterpartyAccount);

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<ApiCategory[]>("/categories"),
    enabled: pickerVisible,
  });

  const { mutate: updateCategory, isPending: saving } = useMutation({
    mutationFn: (payload: { categoryId: string }) =>
      api.patch<ApiTransaction>(`/transactions/${transaction.id}`, payload),
    onSuccess: async (data) => {
      setCurrentCategory(data.category);
      setPickerVisible(false);
      await queryClient.invalidateQueries({ queryKey: ["transactions"], exact: true });
    },
  });

  const { mutate: updateTransaction, isPending: savingEdit } = useMutation({
  mutationFn: (payload: { amount: number; counterpartyName: string; counterpartyAccount: string }) =>
    api.patch<ApiTransaction>(`/transactions/${transaction.id}`, payload),

  onSuccess: async (data) => {
    setCurrentAmount(data.amount);
    setCurrentCounterpartyName(data.counterpartyName);
    setCurrentCounterpartyAccount(data.counterpartyAccount);
    setEditModalVisible(false);
    await queryClient.invalidateQueries({ queryKey: ["transactions"], exact: true });
  },
  onError: (err) => {
    console.log("Update failed:", err);
  }
});

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
              {currentCounterpartyName}
            </Text>
          </View>
          <View className="w-9" />
        </View>

        {/* Transaction summary */}
        <View className="flex-row items-center px-4 py-4 bg-cards border-b border-border">
          <View className="w-10 h-10 rounded-full bg-accent items-center justify-center mr-3" />
          <View className="flex-1">
            <Text className="text-tPrimary text-base font-medium" numberOfLines={1}>
              {currentCounterpartyName || transaction.description || "Unknown"}
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
            accessibilityLabel={`Category: ${currentCategory?.name ?? "Uncategorized"}. Tap to edit.`}
          >
            <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
              <MaterialCommunityIcons name="tag-outline" size={20} color="#fff" />
            </View>
            <Text className="flex-1 text-tPrimary text-base">
              {currentCategory?.name ?? "Uncategorized"}
            </Text>
            <MaterialCommunityIcons name="pencil-outline" size={22} color="#38BDF8" />
          </TouchableOpacity>

          {/* Tags section */}
          <View className="px-4 py-2 bg-background border-b border-border mt-2">
            <Text className="text-sm font-semibold text-tPrimary">Tags</Text>
          </View>

          {currentTags.length > 0 && (
            <View className="px-4 py-4 bg-cards border-b border-border">
              <View className="flex-row flex-wrap gap-2">
                {currentTags.map((tag) => (
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
            <Text className="text-tSecondary text-sm">{currentCounterpartyName}</Text>
            <Text className="text-tSecondary text-sm">{currentCounterpartyAccount}</Text>
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
              setEditAmount(currentAmount);
              setEditCounterpartyName(currentCounterpartyName);
              setEditCounterpartyAccount(currentCounterpartyAccount);
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
                onPress={() => {
                  updateTransaction({
                    amount: parseFloat(editAmount),
                    counterpartyName: editCounterpartyName,
                    counterpartyAccount: editCounterpartyAccount,
                  })
                }}
                disabled={savingEdit}
                accessibilityRole="button"
              >
                {savingEdit ? (
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
                    onPress={() => {
                      updateCategory({
                        categoryId: cat.id
                      })
                    }}
                    disabled={saving}
                  >
                    <Text className="flex-1 text-tPrimary text-base">{cat.name}</Text>
                    {currentCategory?.id === cat.id && (
                      <MaterialCommunityIcons name="check" size={20} color="#38BDF8" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {saving && (
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
