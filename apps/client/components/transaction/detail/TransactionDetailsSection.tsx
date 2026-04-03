import { Text, View } from "react-native";
import { formatDisplayDate } from "@/lib/format";

type Props = {
  date: string;
  bankAccountName: string;
  bankAccountNumber: string;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  description: string | null;
};

export const TransactionDetailsSection = ({ date, bankAccountName, bankAccountNumber, counterpartyName, counterpartyAccount, description }: Props) => (
  <>
    <View className="px-4 py-4 bg-cards border-b border-border">
      <Text className="font-semibold text-tPrimary mb-1">Bank account</Text>
      <Text className="text-tSecondary">{bankAccountName}</Text>
      <Text className="text-tSecondary">{bankAccountNumber}</Text>
    </View>

    <View className="px-4 py-4 bg-cards border-b border-border">
      <Text className="font-semibold text-tPrimary mb-1">Date</Text>
      <Text className="text-tSecondary">{formatDisplayDate(date)}</Text>
    </View>

    {(counterpartyName || counterpartyAccount) && (
      <View className="px-4 py-4 bg-cards border-b border-border">
        <Text className="font-semibold text-tPrimary mb-1">Counterparty</Text>
        {counterpartyName && (<Text className="text-tSecondary">{counterpartyName}</Text>)}
        {counterpartyAccount && (<Text className="text-tSecondary">{counterpartyAccount}</Text>)}
      </View>
    )}

    {description && (
      <View className="px-4 py-4 bg-cards border-b border-border">
        <Text className="font-semibold text-tPrimary mb-1">Description</Text>
        <Text className="text-sm text-tSecondary">{description}</Text>
      </View>
    )}
  </>
);
