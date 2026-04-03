import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ApiTag } from "@/lib/types";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useTags } from "@/hooks/tags/useTags";
import { useCreateTag } from "@/hooks/tags/useCreateTag";
import { useUpdateTransactionTags } from "@/hooks/transactions/useUpdateTransactionTags";
import { SelectedTagList } from "@/components/tags/SelectedTagList";
import { TagInput } from "@/components/tags/TagInput";
import { TagSuggestionItem } from "@/components/tags/TagSuggestionItem";
import { CreateTagOption } from "@/components/tags/CreateTagOption";

export default function EditTags() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();

  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: allTags = [] } = useTags();
  const createTag = useCreateTag();
  const updateTransactionTags = useUpdateTransactionTags();

  const transaction = transactions.find((t) => t.id === transactionId) ?? null;

  const [selectedTags, setSelectedTags] = useState<ApiTag[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (transaction !== null && !initialized.current) {
      setSelectedTags(transaction.tags);
      initialized.current = true;
    }
  }, [transaction]);

  const [inputValue, setInputValue] = useState("");

  const suggestions = allTags.filter(
    (tag) =>
      inputValue.trim().length > 0 &&
      tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedTags.some((t) => t.id === tag.id)
  );

  const showCreateOption =
    inputValue.trim().length > 0 &&
    !allTags.some((tag) => tag.name.toLowerCase() === inputValue.trim().toLowerCase()) &&
    !selectedTags.some((t) => t.name.toLowerCase() === inputValue.trim().toLowerCase());

  const addTag = (tag: ApiTag) => {
    setSelectedTags((prev) => [...prev, tag]);
    setInputValue("");
  };

  const handleCreateAndAdd = async () => {
    const name = inputValue.trim();
    if (!name) return;

    try {
      await createTag.mutateAsync(name);

      const tags = queryClient.getQueryData<ApiTag[]>(['tags', userId]) ?? [];
      const newTag = tags.find((t) => t.name === name);

      if (newTag !== undefined) {
        addTag(newTag);
      }
    } catch {
      Alert.alert("Error", "Failed to create tag. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#257D71" />
      </SafeAreaView>
    );
  }

  return (
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
          <Text className="text-tPrimary font-semibold text-base">Edit tags</Text>
        </View>
        <View className="w-9" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {/* Current tags */}
        <View className="px-4 py-2 bg-background border-b border-border">
          <Text className="text-sm font-semibold text-tPrimary">Current tags</Text>
        </View>

        <SelectedTagList
          tags={selectedTags}
          onRemove={(tag) => setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id))}
        />

        {/* Tag input */}
        <View className="px-4 py-2 bg-background border-b border-border mt-2">
          <Text className="text-sm font-semibold text-tPrimary">Add tag</Text>
        </View>

        <TagInput value={inputValue} onChangeText={setInputValue} />

        {/* Suggestions */}
        {suggestions.map((tag) => (
          <TagSuggestionItem key={tag.id} tag={tag} onPress={() => addTag(tag)} />
        ))}

        {/* Create new tag option */}
        {showCreateOption && (
          <CreateTagOption tagName={inputValue.trim()} onPress={handleCreateAndAdd} />
        )}

        {/* Save button */}
        <TouchableOpacity
          className="mx-4 mt-6 py-3 bg-primary rounded-xl items-center"
          onPress={() =>
            updateTransactionTags.mutate(
              { transactionId: transactionId, tags: selectedTags },
              { onSuccess: () => router.back() }
            )
          }
          disabled={updateTransactionTags.isPending}
          accessibilityRole="button"
          accessibilityLabel="Save tags"
        >
          {updateTransactionTags.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
