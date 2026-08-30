# Zakat payment tracker specification

Date: 27 Aug 2026

The tracker belongs to a **saved calculation**, not to the live calculator. This keeps
the original obligation immutable while allowing the user to record disbursements over
days or months. If the current Results screen has not been saved, tapping **Add payment**
first opens the existing save-and-name flow, then continues into the payment form.

| Figure | Rule |
|---|---|
| Zakat due | The saved `result.totalZakat`; payment edits never change it |
| Total paid | Sum of active payment amounts |
| Remaining | `max(0, zakatDue - totalPaid)` |
| Extra paid | `max(0, totalPaid - zakatDue)` |
| Progress | `zakatDue > 0 ? min(1, totalPaid / zakatDue) : 0` |

## Data model

Every payment carries its payment date and time. `updatedAt` resolves edits made on two
devices. A deleted payment remains as a hidden tombstone so an older iCloud copy cannot
resurrect it.

```ts
interface ZakatPayment {
  id: string;
  name: string;
  amount: number;
  paidAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface SavedCalculation {
  // Existing fields remain unchanged.
  payments?: ZakatPayment[];
}
```

The shared backup envelope remains version 1. `payments` is optional, old records read
as an empty list, and old readers ignore the additional field. The existing immutable
calculation fields keep local precedence during a merge. Payments merge separately by
payment id; the copy with the later `updatedAt` wins, including a copy with `deletedAt`.

| Mutation | Persistence behavior |
|---|---|
| Add | Create stable id; set `paidAt` and `updatedAt`; persist immediately |
| Edit | Keep id and `paidAt`; update name, amount and `updatedAt` |
| Delete | Set `deletedAt` and `updatedAt`; hide from UI; retain for sync |
| Backup replace | Restore the record and its payment tombstones exactly |
| Backup merge | Keep local calculation facts; merge payments by id and latest update |

## Results flow

The payment section sits below the Zakat breakdown and before the existing save/share
actions. It shows Zakat due, total paid, remaining, a restrained progress bar and the
payment list. **Add payment** asks for a required name and positive amount. The payment
date and time default to now and are displayed on every row. Editing changes the name
and amount without rewriting the original timestamp.

The existing save button and the payment tracker share one `ensureSaved()` function.
It returns the saved calculation id, prevents duplicate records, and preserves the
existing named-calculation flow. A cancelled save cancels the payment action too.

## History flow

Each History card shows a compact payment status when at least one active payment exists.
The expanded card shows the full payment section after the category breakdown. Add,
edit and delete target the same calculation id and never create a second yearly record.

| State | Presentation |
|---|---|
| No payments | `No payments recorded` and Add payment action |
| Partially paid | Paid and remaining figures plus progress |
| Fully paid | Remaining zero and `Fully paid` status |
| Overpaid | Remaining zero plus a separate `Extra paid` figure |
| Zakat due zero | No percentage; due, paid and remaining stay explicit |

## Validation and accessibility

The name is required after trimming. The amount must be finite and greater than zero.
The amount field reuses the app's localized-digit parser and thousands separators. RTL
order, text alignment, tap sizes, Dynamic Type caps and no-em-dash checks follow the
existing app rules.

## Acceptance tests

Tests must cover old records without payments, add/edit/delete totals, overpayment,
zero due, localized digits, restart persistence, backup round trip, cross-device merge,
delete tombstones, unchanged original calculation facts, and matching totals between
Results and History.

