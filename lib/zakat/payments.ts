import type { SavedCalculation, ZakatPayment } from "./types";
import { normalizeDigits } from "./numbers";

export interface PaymentSummary {
  due: number;
  paid: number;
  remaining: number;
  extraPaid: number;
  progress: number;
  active: ZakatPayment[];
}

export interface PaymentDraft {
  name: string;
  amount: number;
  paidAt: string;
}

export type PaymentValidationError = "name-required" | "amount-invalid" | "date-invalid";

export type PaymentValidation =
  | { ok: true; value: PaymentDraft }
  | { ok: false; error: PaymentValidationError };

export interface PaymentDateParts {
  date: string;
  time: string;
}

const pad2 = (value: number) => String(value).padStart(2, "0");

export function paymentDateParts(iso: string): PaymentDateParts {
  const date = new Date(iso);
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return {
    date: `${safe.getFullYear()}-${pad2(safe.getMonth() + 1)}-${pad2(safe.getDate())}`,
    time: `${pad2(safe.getHours())}:${pad2(safe.getMinutes())}`,
  };
}

export function paymentIsoFromParts(dateText: string, timeText: string): string | null {
  const dateMatch = normalizeDigits(dateText.trim()).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = normalizeDigits(timeText.trim()).match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;
  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }
  return date.toISOString();
}

function finitePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function validIso(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(new Date(value).getTime());
}

export function isStoredPayment(value: unknown): value is ZakatPayment {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payment = value as Partial<ZakatPayment>;
  return (
    typeof payment.id === "string" &&
    payment.id.length > 0 &&
    typeof payment.name === "string" &&
    payment.name.trim().length > 0 &&
    finitePositive(Number(payment.amount)) > 0 &&
    validIso(payment.paidAt) &&
    validIso(payment.updatedAt) &&
    (payment.deletedAt === undefined || validIso(payment.deletedAt))
  );
}

export function validatePaymentDraft(draft: PaymentDraft): PaymentValidation {
  const name = draft.name.trim();
  if (!name) return { ok: false, error: "name-required" };
  if (finitePositive(draft.amount) <= 0) return { ok: false, error: "amount-invalid" };
  if (!draft.paidAt || Number.isNaN(new Date(draft.paidAt).getTime())) {
    return { ok: false, error: "date-invalid" };
  }
  return {
    ok: true,
    value: { name, amount: draft.amount, paidAt: new Date(draft.paidAt).toISOString() },
  };
}

export function createPayment(
  id: string,
  draft: PaymentDraft,
  updatedAt: string,
): ZakatPayment | null {
  const valid = validatePaymentDraft(draft);
  if (!valid.ok || !id || Number.isNaN(new Date(updatedAt).getTime())) return null;
  return { id, ...valid.value, updatedAt: new Date(updatedAt).toISOString() };
}

export function updatePayment(
  payment: ZakatPayment,
  draft: PaymentDraft,
  updatedAt: string,
): ZakatPayment | null {
  const valid = validatePaymentDraft(draft);
  if (!valid.ok || Number.isNaN(new Date(updatedAt).getTime())) return null;
  return {
    ...payment,
    ...valid.value,
    updatedAt: new Date(updatedAt).toISOString(),
    deletedAt: undefined,
  };
}

export function tombstonePayment(payment: ZakatPayment, deletedAt: string): ZakatPayment | null {
  if (Number.isNaN(new Date(deletedAt).getTime())) return null;
  const timestamp = new Date(deletedAt).toISOString();
  return { ...payment, updatedAt: timestamp, deletedAt: timestamp };
}

export function paymentTimestamp(payment: ZakatPayment): string {
  return payment.updatedAt || payment.paidAt || "";
}

export function activePayments(payments?: ZakatPayment[]): ZakatPayment[] {
  return (payments ?? [])
    .filter((payment) => !payment.deletedAt && finitePositive(payment.amount) > 0)
    .sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || ""));
}

export function summarizePayments(due: number, payments?: ZakatPayment[]): PaymentSummary {
  const active = activePayments(payments);
  const normalizedDue = Math.max(0, Number.isFinite(due) ? due : 0);
  const paid = active.reduce((sum, payment) => sum + finitePositive(payment.amount), 0);
  return {
    due: normalizedDue,
    paid,
    remaining: Math.max(0, normalizedDue - paid),
    extraPaid: Math.max(0, paid - normalizedDue),
    progress: normalizedDue > 0 ? Math.min(1, paid / normalizedDue) : 0,
    active,
  };
}

/**
 * Merge payment events by stable id. The later update wins, including a deletion
 * tombstone. Equal timestamps keep local data, matching the no-silent-overwrite rule.
 */
export function mergePayments(
  local?: ZakatPayment[],
  remote?: ZakatPayment[],
): { payments: ZakatPayment[]; changed: boolean } {
  const merged = new Map<string, ZakatPayment>();
  for (const payment of local ?? []) {
    if (payment && typeof payment.id === "string" && payment.id) merged.set(payment.id, payment);
  }

  let changed = false;
  for (const payment of remote ?? []) {
    if (!payment || typeof payment.id !== "string" || !payment.id) continue;
    const existing = merged.get(payment.id);
    if (!existing) {
      merged.set(payment.id, payment);
      changed = true;
    } else if (paymentTimestamp(payment) > paymentTimestamp(existing)) {
      merged.set(payment.id, payment);
      changed = true;
    }
  }

  return {
    payments: [...merged.values()].sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || "")),
    changed,
  };
}

export function mergeCalculationPayments(
  local: SavedCalculation,
  remote: SavedCalculation,
): { calculation: SavedCalculation; changed: boolean } {
  const merged = mergePayments(local.payments, remote.payments);
  if (!merged.changed) return { calculation: local, changed: false };
  return { calculation: { ...local, payments: merged.payments }, changed: true };
}

export function upsertCalculationPayment(
  history: SavedCalculation[],
  calculationId: string,
  payment: ZakatPayment,
): SavedCalculation[] {
  return history.map((calculation) => {
    if (calculation.id !== calculationId) return calculation;
    const payments = [...(calculation.payments ?? [])];
    const index = payments.findIndex((item) => item.id === payment.id);
    if (index === -1) payments.push(payment);
    else payments[index] = payment;
    payments.sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || ""));
    return { ...calculation, payments };
  });
}

export function deleteCalculationPayment(
  history: SavedCalculation[],
  calculationId: string,
  paymentId: string,
  deletedAt: string,
): SavedCalculation[] {
  return history.map((calculation) => {
    if (calculation.id !== calculationId) return calculation;
    const existing = calculation.payments?.find((payment) => payment.id === paymentId);
    if (!existing) return calculation;
    const deleted = tombstonePayment(existing, deletedAt);
    return deleted ? { ...calculation, payments: (calculation.payments ?? []).map((payment) => payment.id === paymentId ? deleted : payment) } : calculation;
  });
}
