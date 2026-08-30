import { describe, expect, it } from "vitest";

import { nisabProgressLabel } from "../lib/zakat/nisab-progress";

describe("nisabProgressLabel", () => {
  it("reports a percentage while below the threshold", () => {
    expect(nisabProgressLabel(500, 2000)).toEqual({ kind: "percent", percent: 25 });
  });

  it("switches to passed at exactly the threshold", () => {
    expect(nisabProgressLabel(2000, 2000)).toEqual({ kind: "passed", percent: 100 });
  });

  it("reports passed rather than a multiple for large holdings", () => {
    // The old copy said "10x+ of the Nisab threshold" here, which Ahmed could not read.
    // A multiple says nothing about what is owed, so it is gone.
    expect(nisabProgressLabel(200000, 2000)).toEqual({ kind: "passed", percent: 100 });
  });

  it("treats an unset threshold as zero progress, not as passed", () => {
    expect(nisabProgressLabel(5000, 0)).toEqual({ kind: "percent", percent: 0 });
  });

  it("never reports a negative percentage", () => {
    // Deductions can exceed assets, which would otherwise render as "-40%".
    expect(nisabProgressLabel(-800, 2000)).toEqual({ kind: "percent", percent: 0 });
  });
});

