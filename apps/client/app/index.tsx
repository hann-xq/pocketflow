import { useAuth } from "@/lib/auth-context";
import { Redirect } from "expo-router";

export default function Index() {
  const { token } = useAuth();
  return <Redirect href={token ? "/(tabs)/insights" : "/(auth)/login"} />;
}
