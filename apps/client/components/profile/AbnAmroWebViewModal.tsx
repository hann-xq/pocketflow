import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView, { type WebViewNavigation } from "react-native-webview";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ExternalConnectionSession } from "@/lib/bank-account-utils";

type Props = {
  session: ExternalConnectionSession | null;
  isLoadingAuthUrl: boolean;
  isExchangingCode: boolean;
  onClose: () => void;
  onNavigation: (navState: WebViewNavigation) => boolean;
};

export function AbnAmroWebViewModal({
  session,
  isLoadingAuthUrl,
  isExchangingCode,
  onClose,
  onNavigation,
}: Props) {
  return (
    <>
      <Modal visible={session !== null} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center px-4 py-3 border-b border-border">
            <TouchableOpacity
              onPress={onClose}
              className="p-1 mr-3"
              accessibilityRole="button"
              accessibilityLabel="Cancel ABN AMRO connection"
            >
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text className="text-tPrimary text-base font-semibold">Connect ABN AMRO</Text>
          </View>

          {isExchangingCode ? (
            <View className="flex-1 items-center justify-center gap-3">
              <ActivityIndicator size="large" color="#64748B" />
              <Text className="text-tSecondary">Completing connection...</Text>
            </View>
          ) : session ? (
            <WebView
              source={{ uri: session.authorizationUrl }}
              onShouldStartLoadWithRequest={onNavigation}
            />
          ) : null}
        </SafeAreaView>
      </Modal>

      <Modal visible={isLoadingAuthUrl} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40">
          <View className="bg-background rounded-2xl px-8 py-6 items-center gap-3">
            <ActivityIndicator size="large" color="#64748B" />
            <Text className="text-tSecondary">Opening ABN AMRO...</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
