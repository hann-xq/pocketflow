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

// 2-letter country code + 2-digit check number + 4-char bank code + 10-digit account number
const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z]{4}\d{10}$/;

export function validateIban(value: string): string | null {
  const iban = value.replace(/\s/g, "");
  if (!iban) return "Account number is required.";
  if (!/^[A-Z]{2}/.test(iban)) return "IBAN must start with a 2-letter country code (e.g. NL).";
  if (!/^[A-Z]{2}\d{2}/.test(iban)) return "Country code must be followed by 2 check digits.";
  if (!IBAN_REGEX.test(iban))
    return "Invalid IBAN format. Expected: 2-letter country code, 2 check digits, 4-letter bank code, 10-digit account number.";
  return null;
}
