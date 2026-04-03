import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import type { ReactNode } from "react";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxHeightClass?: string;
};

export const BottomSheetModal = ({ visible, title, onClose, children, maxHeightClass }: Props) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent={true}
    onRequestClose={onClose}
  >
    <Pressable className="flex-1 bg-black/50" onPress={onClose} />

    <View className={`bg-background rounded-t-2xl${maxHeightClass ? ` ${maxHeightClass}` : ""}`}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
        <Text className="text-tPrimary text-lg font-semibold">{title}</Text>
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.tSecondary} />
        </TouchableOpacity>
      </View>

      {children}
    </View>
  </Modal>
);
