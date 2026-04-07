import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_LOCALE: Record<string, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  EUR: "de-DE",
};

export function formatCurrency(amount: number, currency: string = "BRL"): string {
  const locale = CURRENCY_LOCALE[currency] ?? "pt-BR";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}
