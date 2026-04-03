import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomSheetModal } from "@/components/BottomSheetModal";
import { useCategories } from "@/hooks/categories/useCategories";

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedCategoryId?: string | null;
  onSelect: (categoryId: string) => void;
  isPending?: boolean;
  transactionType: "expense" | "income";
};

export function CategoryPickerModal({ visible, onClose, selectedCategoryId, onSelect, isPending, transactionType }: Props) {
  const { data: allCategories = [], isLoading } = useCategories();
  const categories = allCategories.filter((c) => c.type === transactionType);

  return (
    <BottomSheetModal
      visible={visible}
      title="Select category"
      onClose={onClose}
      maxHeightClass="max-h-[60%]"
    >
      {isLoading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#38BDF8" />
        </View>
      ) : (
        <ScrollView>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              className="flex-row items-center px-4 py-4 border-b border-border"
              onPress={() => onSelect(cat.id)}
              disabled={isPending}
              accessibilityRole="button"
              accessibilityLabel={cat.name}
            >
              <Text className="flex-1 text-tPrimary text-base">{cat.name}</Text>
              {selectedCategoryId === cat.id && (
                <MaterialCommunityIcons name="check" size={20} color="#38BDF8" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {isPending && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <ActivityIndicator color="#38BDF8" />
        </View>
      )}
    </BottomSheetModal>
  );
}
