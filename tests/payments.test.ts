import { describe, expect, it } from "vitest";

import {
  activePayments,
  createPayment,
  deleteCalculationPayment,
  mergePayments,
  paymentDateParts,
  paymentIsoFromParts,
  summarizePayments,
  tombstonePayment,
  updatePayment,
  upsertCalculationPayment,
  validatePaymentDraft,
} from "../lib/zakat/payments";
import type { ZakatPayment } from "../lib/zakat/types";

function payment(
  id: string,
  amount: number,
  updatedAt = "2026-08-27T10:00:00Z",
  extra: Partial<ZakatPayment> = {},
): ZakatPayment {
  return {
    id,
    name: `Payment ${id}`,
    amount,
    paidAt: updatedAt,
    updatedAt,
    ...extra,
  };
}

describe("payment validation and mutations", () => {
  it("trims the name and normalizes timestamps", () => {
    const result = validatePaymentDraft({
      name: "  Charity A  ",
      amount: 500,
      paidAt: "2026-08-27T10:00:00Z",
    });
    expect(result).toEqual({
      ok: true,
      value: { name: "Charity A", amount: 500, paidAt: "2026-08-27T10:00:00.000Z" },
    });
  });

  it("rejects a missing name, non-positive amount and invalid date", () => {
    expect(validatePaymentDraft({ name: " ", amount: 1, paidAt: "2026-08-27" })).toEqual({
      ok: false,
      error: "name-required",
    });
    expect(validatePaymentDraft({ name: "A", amount: 0, paidAt: "2026-08-27" })).toEqual({
      ok: false,
      error: "amount-invalid",
    });
    expect(validatePaymentDraft({ name: "A", amount: 1, paidAt: "not-a-date" })).toEqual({
      ok: false,
      error: "date-invalid",
    });
  });

  it("creates, edits and tombstones without changing the stable id", () => {
    const created = createPayment(
      "stable-1",
      { name: "A", amount: 100, paidAt: "2026-08-27T10:00:00Z" },
      "2026-08-27T10:01:00Z",
    );
    expect(created?.id).toBe("stable-1");
    const edited = updatePayment(
      created!,
      { name: "B", amount: 150, paidAt: created!.paidAt },
      "2026-08-27T11:00:00Z",
    );
    expect(edited).toMatchObject({ id: "stable-1", name: "B", amount: 150 });
    const deleted = tombstonePayment(edited!, "2026-08-27T12:00:00Z");
    expect(deleted).toMatchObject({
      id: "stable-1",
      deletedAt: "2026-08-27T12:00:00.000Z",
      updatedAt: "2026-08-27T12:00:00.000Z",
    });
  });

  it("updates payments only on the targeted saved calculation", () => {
    const base = { id: "calc-a", savedAt: "2026-08-27T09:00:00Z", payments: [] } as never;
    const other = { id: "calc-b", savedAt: "2026-08-27T09:00:00Z", payments: [] } as never;
    const added = upsertCalculationPayment([base, other], "calc-a", payment("p1", 100));
    expect(added[0].payments).toHaveLength(1);
    expect(added[1].payments).toHaveLength(0);
    const deleted = deleteCalculationPayment(added, "calc-a", "p1", "2026-08-27T12:00:00Z");
    expect(deleted[0].payments?.[0].deletedAt).toBe("2026-08-27T12:00:00.000Z");
  });

  it("round trips editable local date and time and accepts Arabic digits", () => {
    const iso = paymentIsoFromParts("٢٠٢٦-٠٨-٢٧", "١٤:٣٠");
    expect(iso).not.toBeNull();
    expect(paymentDateParts(iso!)).toEqual({ date: "2026-08-27", time: "14:30" });
    expect(paymentIsoFromParts("2026-02-31", "14:30")).toBeNull();
    expect(paymentIsoFromParts("2026-08-27", "25:00")).toBeNull();
  });
});

describe("payment accounting", () => {
  it("treats an old saved calculation with no payment field as unpaid", () => {
    expect(summarizePayments(1_000, undefined)).toMatchObject({
      paid: 0,
      remaining: 1_000,
      extraPaid: 0,
      progress: 0,
    });
  });

  it("adds partial payments and calculates the balance", () => {
    const summary = summarizePayments(1_000, [payment("a", 250), payment("b", 300)]);
    expect(summary).toMatchObject({ paid: 550, remaining: 450, extraPaid: 0, progress: 0.55 });
  });

  it("caps remaining and progress while exposing overpayment separately", () => {
    const summary = summarizePayments(1_000, [payment("a", 1_125)]);
    expect(summary).toMatchObject({ paid: 1_125, remaining: 0, extraPaid: 125, progress: 1 });
  });

  it("does not divide by zero or count invalid and deleted payments", () => {
    const deletedAt = "2026-08-27T12:00:00Z";
    const payments = [
      payment("a", 100, deletedAt, { deletedAt }),
      payment("b", 0),
      payment("c", Number.NaN),
    ];
    expect(summarizePayments(0, payments)).toMatchObject({ paid: 0, remaining: 0, progress: 0 });
    expect(activePayments(payments)).toEqual([]);
  });
});

describe("payment sync merge", () => {
  it("adds a payment created on the other device", () => {
    const merged = mergePayments([payment("a", 100)], [payment("b", 200)]);
    expect(merged.changed).toBe(true);
    expect(merged.payments.map((item) => item.id).sort()).toEqual(["a", "b"]);
  });

  it("uses the later edit for the same payment id", () => {
    const local = payment("a", 100, "2026-08-27T10:00:00Z");
    const remote = payment("a", 175, "2026-08-27T11:00:00Z");
    expect(mergePayments([local], [remote]).payments[0].amount).toBe(175);
  });

  it("keeps a later deletion tombstone so an old device cannot resurrect it", () => {
    const local = payment("a", 100, "2026-08-27T10:00:00Z");
    const remote = payment("a", 100, "2026-08-27T12:00:00Z", {
      deletedAt: "2026-08-27T12:00:00Z",
    });
    const merged = mergePayments([local], [remote]);
    expect(merged.payments[0].deletedAt).toBe("2026-08-27T12:00:00Z");
    expect(summarizePayments(500, merged.payments).paid).toBe(0);
  });

  it("keeps local on equal timestamps", () => {
    const local = payment("a", 100);
    const remote = payment("a", 999);
    expect(mergePayments([local], [remote])).toEqual({ payments: [local], changed: false });
  });
});
