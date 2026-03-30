import { Text, View, TouchableOpacity } from "react-native";
import "../global.css";
import { useAuth } from "../../lib/auth-context";

export default function Profile() {
  const { logout } = useAuth();

  return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl text-primary font-bold" accessibilityRole="header">Profile.</Text>
        <TouchableOpacity
          onPress={logout}
          className="mt-6 px-6 py-3 bg-secondary rounded-lg"
        >
          <Text className="text-white font-semibold">Log Out</Text>
        </TouchableOpacity>
      </View>
  );
}