// The label under the Nisab progress bar.
//
// This used to read "10x+ of the Nisab threshold" for large holdings. Ahmed could not tell
// what it meant, and he was right to object: a multiple of Nisab says nothing about what is
// owed. Zakat is 2.5% of the wealth whether it sits at 3x or 30x the threshold, so the
// multiple is arithmetic with no decision behind it. Below the threshold the percentage is
// genuinely useful, because it answers "how close am I", so that case is kept.
//
// Pure so the wording rule is testable without rendering a screen.
export interface NisabProgressLabel {
  /** "percent" while still climbing, "passed" once the threshold is behind. */
  kind: "percent" | "passed";
  /** Whole percent of the threshold reached. Only meaningful when kind is "percent". */
  percent: number;
}

export function nisabProgressLabel(netHoldings: number, threshold: number): NisabProgressLabel {
  // No threshold means metal prices are not set yet. Treat as zero progress rather than
  // dividing by zero and reporting a passed threshold the user never crossed.
  if (!(threshold > 0)) return { kind: "percent", percent: 0 };

  const ratio = netHoldings / threshold;
  if (ratio >= 1) return { kind: "passed", percent: 100 };

  return { kind: "percent", percent: Math.max(0, Math.round(ratio * 100)) };
}
