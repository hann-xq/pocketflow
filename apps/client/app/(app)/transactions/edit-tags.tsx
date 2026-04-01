import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import type { ApiTag, ApiTransaction } from "@/lib/types";

export default function EditTags() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const queryClient = useQueryClient();

  const { data: transaction, isLoading: loadingTransaction } = useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: () => api.get<ApiTransaction>(`/transactions/${transactionId}`),
  });

  const { data: allTags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<ApiTag[]>("/tags"),
  });

  const [selectedTags, setSelectedTags] = useState<ApiTag[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (transaction && !initialized.current) {
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

  const { mutateAsync: createTag } = useMutation({
    mutationFn: (name: string) => api.post<ApiTag>("/tags", { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });

  const { mutate: saveTransaction, isPending: saving } = useMutation({
    mutationFn: (tagIds: string[]) =>
      api.patch(`/transactions/${transactionId}`, { tagIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", transactionId] });
      router.back();
    },
  });

  const addTag = (tag: ApiTag) => {
    setSelectedTags((prev) => [...prev, tag]);
    setInputValue("");
  };

  const handleCreateAndAdd = async () => {
    const name = inputValue.trim();
    if (!name) return;
    try {
      const newTag = await createTag(name);
      addTag(newTag);
    } catch {
      Alert.alert("Error", "Failed to create tag. Please try again.");
    }
  };

  if (loadingTransaction) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-background items-center justify-center">
          <ActivityIndicator color="#257D71" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

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
            <Text className="text-tPrimary font-semibold text-base">Edit tags</Text>
          </View>
          <View className="w-9" />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {/* Current tags */}
          <View className="px-4 py-2 bg-background border-b border-border">
            <Text className="text-sm font-semibold text-tPrimary">Current tags</Text>
          </View>

          <View className="px-4 py-4 bg-cards border-b border-border min-h-16">
            {selectedTags.length === 0 ? (
              <Text className="text-tSecondary text-sm">No tags added yet</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <View
                    key={tag.id}
                    className="flex-row items-center bg-accent px-3 py-1 rounded-full gap-1"
                  >
                    <Text className="text-primary text-sm font-medium">#{tag.name}</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id))}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove tag ${tag.name}`}
                    >
                      <MaterialCommunityIcons name="close" size={14} color="#257D71" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Tag input */}
          <View className="px-4 py-2 bg-background border-b border-border mt-2">
            <Text className="text-sm font-semibold text-tPrimary">Add tag</Text>
          </View>

          <View className="px-4 py-4 bg-cards border-b border-border">
            <TextInput
              className="bg-background text-tPrimary px-3 py-3 rounded-lg border border-border"
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Type a tag name..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Suggestions */}
          {suggestions.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              className="flex-row items-center px-4 py-4 bg-cards border-b border-border"
              onPress={() => addTag(tag)}
            >
              <MaterialCommunityIcons name="tag-outline" size={18} color="#257D71" style={{ marginRight: 10 }} />
              <Text className="text-tPrimary text-sm">#{tag.name}</Text>
            </TouchableOpacity>
          ))}

          {/* Create new tag option */}
          {showCreateOption && (
            <TouchableOpacity
              className="flex-row items-center px-4 py-4 bg-cards border-b border-border"
              onPress={handleCreateAndAdd}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#257D71" style={{ marginRight: 10 }} />
              <Text className="text-primary text-sm">Create &quot;#{inputValue.trim()}&quot;</Text>
            </TouchableOpacity>
          )}

          {/* Save button */}
          <TouchableOpacity
            className="mx-4 mt-6 py-3 bg-primary rounded-xl items-center"
            onPress={() => saveTransaction(selectedTags.map((t) => t.id))}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Save tags"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Save</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
