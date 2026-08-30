import { describe, expect, it } from "vitest";

import { dictionaryFor, translatedLocales } from "../lib/i18n/dictionaries";

const textKeys = [
  "paymentProgress",
  "totalPaid",
  "paymentRemainingLabel",
  "extraPaid",
  "payments",
  "addPayment",
  "editPayment",
  "deletePayment",
  "deletePaymentConfirm",
  "paymentName",
  "paymentNamePlaceholder",
  "paymentAmount",
  "paymentDateTime",
  "fullyPaid",
  "noPayments",
  "saveBeforePayment",
  "paymentAmountError",
  "paymentNameError",
  "paymentDateError",
  "breakdownShow",
  "breakdownHide",
  "breakdownDeducted",
  "breakdownEmpty",
  "deductionZakatAdjustment",
  "viewPaymentDetails",
  "homePaymentSaveHint",
  "reviewAndTrack",
] as const;

describe("payment tracker dictionaries", () => {
  for (const locale of translatedLocales()) {
    it(`${locale} has complete payment copy without em dashes`, () => {
      const dictionary = dictionaryFor(locale);
      for (const key of textKeys) {
        expect(dictionary[key].trim(), key).not.toBe("");
        expect(dictionary[key], key).not.toContain("—");
      }
      expect(dictionary.paymentPaidOf("100", "500")).toContain("100");
      expect(dictionary.paymentPaidOf("100", "500")).toContain("500");
      expect(dictionary.paymentRemaining("400")).toContain("400");
      expect(dictionary.paymentExtra("25")).toContain("25");
      expect(dictionary.trackingCalculation("1448")).toContain("1448");
      expect(dictionary.breakdownNisabLine("silver", "2,975")).toContain("2,975");
      expect(dictionary.breakdownBelowNisab("silver", "2,975")).toContain("2,975");
      const deductionExplanation = dictionary.deductionZakatExplanation("53,113", "1,327.83");
      expect(deductionExplanation).toContain("53,113");
      expect(deductionExplanation).toContain("1,327.83");
    });
  }
});
