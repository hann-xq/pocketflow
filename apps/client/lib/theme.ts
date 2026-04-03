import tailwindConfig from "@/tailwind.config";

export const { colors } = tailwindConfig.theme!.extend as { colors: Record<string, string> };
