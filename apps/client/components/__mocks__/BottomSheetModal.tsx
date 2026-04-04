// Manual mock for BottomSheetModal.
//
// The real component renders a React Native Modal, which is not supported in
// the Jest/jsdom environment and causes test failures. This mock replaces it
// with a plain View so tests can assert on the sheet's content without needing
// a native modal renderer.
//
// Why here and not apps/client/__mocks__/?
// Jest resolves manual mocks for local modules by looking for a __mocks__
// directory *next to the source file*. The root __mocks__/ folder is only for
// node_modules (e.g. expo-router, @expo/vector-icons). Because BottomSheetModal
// lives at components/BottomSheetModal.tsx, its manual mock must live at
// components/__mocks__/BottomSheetModal.tsx for Jest to find it automatically
// when a test calls jest.mock('@/components/BottomSheetModal').

import { Text, TouchableOpacity, View } from 'react-native';
import type { ReactNode } from 'react';

export const BottomSheetModal = ({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => {
  if (!visible) return null;

  return (
    <View>
      <Text>{title}</Text>
      <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
        <Text>Close</Text>
      </TouchableOpacity>
      {children}
    </View>
  );
};
