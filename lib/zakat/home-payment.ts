import type { SavedCalculation } from "./types";

export type HomePaymentState =
  | { kind: "hidden" }
  | { kind: "save-first" }
  | { kind: "tracked"; calculation: SavedCalculation };

/** Selects one immutable saved obligation for the Home payment card. */
export function homePaymentState({
  history,
  trackedCalculationId,
  hasEntries,
}: {
  history: SavedCalculation[];
  trackedCalculationId?: string | null;
  hasEntries: boolean;
}): HomePaymentState {
  const remembered = trackedCalculationId
    ? history.find((item) => item.id === trackedCalculationId)
    : undefined;
  const calculation = remembered ?? history[0];

  if (calculation) return { kind: "tracked", calculation };
  if (hasEntries) return { kind: "save-first" };
  return { kind: "hidden" };
}
