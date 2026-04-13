export type Transaction = {
  id: string;
  type: string;
  description: string;
  amount: number | string;
  categoryId?: string | null;
  accountId: string;
  date: string;
  dueDate?: string | null;
  receiveDate?: string | null;
  isPaid: boolean;
  subtype?: string;
  recurringGroupId?: string | null;
  totalOccurrences?: number | null;
  notes?: string | null;
  tags?: string[];
  location?: string | null;
};

export type CreditCard = {
  id: string;
  name: string;
  bank: string;
  lastDigits: string;
  limit: number | string;
  usedAmount?: number | string;
  dueDay: number | string;
  closingDay: number | string;
  gradient: string;
  color: string;
  network: string;
};

export type CardTransaction = {
  id: string;
  description: string;
  amount: number | string;
  categoryId?: string | null;
  invoiceMonth: number;
  invoiceYear: number;
  groupId?: string | null;
  type?: string;
  date: string;
  isPaid?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  notes?: string | null;
};

export type CategoryItem = {
  id: string;
  name: string;
  type: string;
  color?: string;
  tags?: string[];
};

export type AccountItem = {
  id: string;
  name: string;
  type?: string;
  balance?: number | string;
};

export type TagItem = {
  id: string;
  name: string;
};

export type Subtype = "single" | "fixed" | "recurring";

export type FormData = {
  type: "income" | "expense" | "transfer";
  description: string;
  amount: string;
  categoryId: string;
  accountId: string;
  date: string;
  dueDate: string;
  receiveDate: string;
  isPaid: boolean;
  subtype: Subtype;
  totalOccurrences: string;
  notes: string;
  tags: string[];
  location: string;
};

export type NetworkType = "mastercard" | "visa" | "elo" | "amex" | "hipercard";

export const GRADIENT_PRESETS = [
  { label: "Nubank", value: "bg-gradient-to-br from-[#820AD1] to-[#4B0082]", color: "#820AD1" },
  { label: "Inter", value: "bg-gradient-to-br from-[#FF7A00] to-[#E65100]", color: "#FF7A00" },
  { label: "Itau", value: "bg-gradient-to-br from-[#0047BB] to-[#002D72]", color: "#0047BB" },
  { label: "XP", value: "bg-gradient-to-br from-[#111111] to-[#333333]", color: "#111111" },
  { label: "Emerald", value: "bg-gradient-to-br from-[#059669] to-[#065F46]", color: "#059669" },
  { label: "Rose", value: "bg-gradient-to-br from-[#DB2777] to-[#831843]", color: "#DB2777" },
];

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function getSuggestedInvoice(card: CreditCard | null | undefined, dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00'); 
  let m = d.getMonth() + 1;
  let y = d.getFullYear();
  const closing = card ? Number(card.closingDay) : 30;
  if (d.getDate() >= closing) {
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return { month: m, year: y };
}
