import {
  addTransaction,
  deleteTransaction,
  getTransactions,
  Transaction,
  updateTransaction,
} from "@/database/dbHelper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SectionList,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

type Section = { title: string; data: Transaction[] };

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function getTransactionIcon(title: string, isExpense: number) {
  const lower = title.toLowerCase();
  if (lower.includes("mcdonald") || lower.includes("burger") || lower.includes("kfc") || lower.includes("pizza")) {
    return "food";
  }
  if (lower.includes("jumbo") || lower.includes("albert") || lower.includes("lidl") || lower.includes("aldi")) {
    return "shopping";
  }
  if (isExpense) return "cash-minus";
  return "cash-plus";
}

function groupByDate(transactions: Transaction[]): Section[] {
  const map: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    if (!map[t.date]) map[t.date] = [];
    map[t.date].push(t);
  }
  return Object.keys(map).map((date) => ({ title: date, data: map[date] }));
}

function todayISODate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editVisible, setEditVisible] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");

  // Add modal state
  const [addVisible, setAddVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(todayISODate());
  const [newIsExpense, setNewIsExpense] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const data = await getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  const openEdit = (item: Transaction) => {
    setSelected(item);
    setEditTitle(item.title);
    setEditAmount(item.amount.toFixed(2));
    setEditVisible(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    await updateTransaction(selected.id, editTitle, parseFloat(editAmount), selected.date);
    setEditVisible(false);
    loadTransactions();
  };

  const handleDelete = (item: Transaction) => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTransaction(item.id);
            loadTransactions();
          },
        },
      ]
    );
  };

  const handleAdd = async () => {
    const amount = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(amount)) return;
    await addTransaction(newTitle.trim(), amount, newDate, newIsExpense ? 1 : 0);
    setAddVisible(false);
    setNewTitle("");
    setNewAmount("");
    setNewDate(todayISODate());
    setNewIsExpense(true);
    loadTransactions();
  };

  const sections = groupByDate(transactions);

  const renderItem = ({ item }: { item: Transaction }) => {
    const icon = getTransactionIcon(item.title, item.is_expense);

    const renderRightActions = () => (
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        className="bg-red-500 justify-center items-center px-6 border-b border-border"
        accessibilityRole="button"
        accessibilityLabel={`Delete ${item.title}`}
        accessibilityHint="Deletes this transaction after confirmation"
      >
        <MaterialCommunityIcons name="trash-can-outline" size={24} color="white" importantForAccessibility="no" />
      </TouchableOpacity>
    );

    return (
      <ReanimatedSwipeable renderRightActions={renderRightActions}>
        <TouchableOpacity
          onPress={() => openEdit(item)}
          className="flex-row items-center px-4 py-3 bg-cards border-b border-border"
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, ${item.is_expense ? "expense" : "income"}, €${item.amount.toFixed(2)}`}
          accessibilityHint="Double tap to edit this transaction"
        >
          <View
            className="w-10 h-10 rounded-full bg-accent items-center justify-center mr-3"
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden={true}
          >
            <MaterialCommunityIcons name={icon as any} size={20} color="#257D71" />
          </View>
          <Text className="flex-1 text-tPrimary text-base" numberOfLines={1} importantForAccessibility="no">
            {item.title}
          </Text>
          <Text
            className={`text-base font-semibold ${item.is_expense ? "text-tPrimary" : "text-primary"}`}
            importantForAccessibility="no"
          >
            €{item.amount.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </ReanimatedSwipeable>
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View
      className="px-4 py-2 bg-background border-b border-border"
      accessibilityRole="header"
      accessible={true}
      accessibilityLabel={`Transactions for ${formatDisplayDate(section.title)}`}
    >
      <Text className="text-sm text-tSecondary" importantForAccessibility="no">{formatDisplayDate(section.title)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        accessible={true}
        accessibilityLiveRegion="polite"
        accessibilityLabel="Loading transactions"
      >
        <Text className="text-tSecondary" importantForAccessibility="no">Loading transactions...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-background">
        {/* Balance Header */}
        <View
          className="items-center py-6 bg-cards border-b border-border"
          accessible={true}
          accessibilityLabel={`Balance: €${transactions
            .reduce((sum, t) => sum + (t.is_expense ? -t.amount : t.amount), 0)
            .toFixed(2)}`}
          accessibilityRole="summary"
        >
          <Text className="text-4xl font-bold text-tPrimary" importantForAccessibility="no">
            € {transactions
              .reduce((sum, t) => sum + (t.is_expense ? -t.amount : t.amount), 0)
              .toFixed(2)}
          </Text>
          <Text className="text-tSecondary mt-1" importantForAccessibility="no">Balance</Text>
        </View>

        {/* Transaction List */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        {/* FAB - Add Transaction */}
        <TouchableOpacity
          onPress={() => setAddVisible(true)}
          className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
          activeOpacity={0.8}
          style={{ elevation: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Add new transaction"
          accessibilityHint="Opens the add transaction form"
        >
          <MaterialCommunityIcons name="plus" size={28} color="white" importantForAccessibility="no" />
        </TouchableOpacity>

        {/* Edit Modal */}
        <Modal
          visible={editVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditVisible(false)}
          accessibilityViewIsModal={true}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <View className="mx-5 bg-cards rounded-2xl p-6">
              <Text className="text-lg font-bold text-tPrimary mb-5" accessibilityRole="header">Edit Transaction</Text>

              <Text className="text-sm text-tSecondary mb-1" nativeID="editTitleLabel">Title</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Transaction title"
                className="border border-border rounded-xl px-4 py-3 text-tPrimary mb-4"
                style={{ fontSize: 16 }}
                accessibilityLabel="Transaction title"
                accessibilityHint="Enter the title of the transaction"
                accessibilityLabelledBy="editTitleLabel"
              />

              <Text className="text-sm text-tSecondary mb-1" nativeID="editAmountLabel">Amount (€)</Text>
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                className="border border-border rounded-xl px-4 py-3 text-tPrimary mb-6"
                style={{ fontSize: 16 }}
                accessibilityLabel="Amount in euros"
                accessibilityHint="Enter the transaction amount"
                accessibilityLabelledBy="editAmountLabel"
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setEditVisible(false)}
                  className="flex-1 py-3 rounded-xl border border-border items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Cancel editing"
                >
                  <Text className="text-tSecondary font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  className="flex-1 py-3 rounded-xl bg-primary items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Save changes"
                >
                  <Text className="text-white font-semibold">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Add Modal */}
        <Modal
          visible={addVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAddVisible(false)}
          accessibilityViewIsModal={true}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <View className="mx-5 bg-cards rounded-2xl p-6">
              <Text className="text-lg font-bold text-tPrimary mb-5" accessibilityRole="header">New Transaction</Text>

              <Text className="text-sm text-tSecondary mb-1" nativeID="newTitleLabel">Title</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Transaction title"
                className="border border-border rounded-xl px-4 py-3 text-tPrimary mb-4"
                style={{ fontSize: 16 }}
                accessibilityLabel="Transaction title"
                accessibilityHint="Enter the title of the new transaction"
                accessibilityLabelledBy="newTitleLabel"
              />

              <Text className="text-sm text-tSecondary mb-1" nativeID="newAmountLabel">Amount (€)</Text>
              <TextInput
                value={newAmount}
                onChangeText={setNewAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                className="border border-border rounded-xl px-4 py-3 text-tPrimary mb-4"
                style={{ fontSize: 16 }}
                accessibilityLabel="Amount in euros"
                accessibilityHint="Enter the transaction amount"
                accessibilityLabelledBy="newAmountLabel"
              />

              <Text className="text-sm text-tSecondary mb-1" nativeID="newDateLabel">Date (YYYY-MM-DD)</Text>
              <TextInput
                value={newDate}
                onChangeText={setNewDate}
                placeholder="2026-01-01"
                className="border border-border rounded-xl px-4 py-3 text-tPrimary mb-4"
                style={{ fontSize: 16 }}
                accessibilityLabel="Transaction date"
                accessibilityHint="Enter the date in year-month-day format"
                accessibilityLabelledBy="newDateLabel"
              />

              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-tPrimary text-base" nativeID="expenseToggleLabel">Expense</Text>
                <Switch
                  value={newIsExpense}
                  onValueChange={setNewIsExpense}
                  trackColor={{ false: "#E2E8F0", true: "#8FD5C8" }}
                  thumbColor={newIsExpense ? "#257D71" : "#64748B"}
                  accessibilityLabel="Mark as expense"
                  accessibilityHint={newIsExpense ? "Currently marked as expense. Toggle to mark as income" : "Currently marked as income. Toggle to mark as expense"}
                  accessibilityLabelledBy="expenseToggleLabel"
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setAddVisible(false)}
                  className="flex-1 py-3 rounded-xl border border-border items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Cancel adding transaction"
                >
                  <Text className="text-tSecondary font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAdd}
                  className="flex-1 py-3 rounded-xl bg-primary items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Add transaction"
                >
                  <Text className="text-white font-semibold">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
