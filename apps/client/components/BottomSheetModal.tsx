import { KeyboardAvoidingView, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import type { ReactNode } from "react";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxHeightClass?: string;
  avoidKeyboard?: boolean;
};

export const BottomSheetModal = ({ visible, title, onClose, children, maxHeightClass, avoidKeyboard = false }: Props) => {
  const { bottom } = useSafeAreaInsets();

  const sheet = (
    <View
      className={`bg-background rounded-t-2xl${maxHeightClass ? ` ${maxHeightClass}` : ""}`}
      style={{ paddingBottom: bottom }}
    >
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
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      {avoidKeyboard ? (
        <>
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            className="bg-black/50"
            onPress={onClose}
            accessible={false}
            importantForAccessibility="no"
          />
          <KeyboardAvoidingView
            style={{ flex: 1, justifyContent: "flex-end" }}
            behavior="position"
            keyboardVerticalOffset={-bottom}
            pointerEvents="box-none"
          >
            {sheet}
          </KeyboardAvoidingView>
        </>
      ) : (
        <>
          <Pressable
            className="flex-1 bg-black/50"
            onPress={onClose}
            accessible={false}
            importantForAccessibility="no"
          />
          {sheet}
        </>
      )}
    </Modal>
  );
};
