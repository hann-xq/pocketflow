import type { ApiBankAccount } from "@/lib/types";

export type BankAccountFormState = {
  accountName: string;
  accountNumber: string;
};

export type ModalMode = { type: "create" } | { type: "edit"; account: ApiBankAccount };

export type ExternalConnectionSession = {
  authorizationUrl: string;
  accountId: string;
};
