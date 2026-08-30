import { calcDisplayName } from "./calc-name";
import { summarizePayments } from "./payments";
import type { SavedCalculation } from "./types";

function csvEscape(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function historyToCsv(history: SavedCalculation[]): string {
  const header = [
    "Name",
    "Saved at",
    "Hijri year",
    "Hijri date",
    "Currency",
    "Gross wealth",
    "Deductions",
    "Net wealth",
    "Nisab",
    "Total Zakat",
    "Paid",
    "Remaining",
    "Payments",
  ];
  const rows = history.map((calculation) => {
    const payments = summarizePayments(calculation.result.totalZakat, calculation.payments);
    const paymentDetails = payments.active
      .map((payment) => `${payment.name}: ${payment.amount} @ ${payment.paidAt}`)
      .join(" | ");
    return [
      calcDisplayName(calculation),
      new Date(calculation.savedAt).toISOString().replace("T", " ").slice(0, 16),
      calculation.hijriYear,
      calculation.hijriLabel,
      calculation.currency,
      calculation.result.grossWealth,
      calculation.result.totalDeductions,
      calculation.result.netWealth,
      calculation.result.nisabThreshold,
      calculation.result.totalZakat,
      payments.paid,
      payments.remaining,
      paymentDetails,
    ];
  });
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}
