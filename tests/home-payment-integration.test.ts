import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

describe("Home payment integration contract", () => {
  it("renders payment progress on Home and opens the exact History record", () => {
    const home = fs.readFileSync(path.join(root, "app/(tabs)/index.tsx"), "utf8");
    const card = fs.readFileSync(path.join(root, "components/zakat/home-payment-card.tsx"), "utf8");
    const history = fs.readFileSync(path.join(root, "app/(tabs)/history.tsx"), "utf8");

    expect(home).toContain("<HomePaymentCard state={paymentState}");
    expect(card).toContain("params: { calculationId: calculation.id }");
    expect(history).toContain("data={displayedHistory}");
    expect(history).toContain("initiallyExpanded={requestedCalculationId === item.id}");
  });

  it("remembers the selected obligation when it is saved or a payment is managed", () => {
    const store = fs.readFileSync(path.join(root, "lib/store.tsx"), "utf8");
    expect(store).toContain("trackedCalculationId: action.payload.id");
    expect(store).toContain("trackedCalculationId: action.calculationId");
    expect(store).toContain('type: "setTrackedCalculation"');
  });
});
