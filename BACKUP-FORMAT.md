# Zakat Calculator backup file format v1

Shared between the Android and iOS apps. Either app must read a file written by the other,
because Ahmed's stated goal is that a user moving between platforms keeps their data. Neither
app uploads this file anywhere: the user saves it themselves, to their own Drive, iCloud Drive,
Files, or wherever they like.

Owner: Android session wrote v1. iOS implements against this rather than inventing a second shape.
Backward-compatible optional fields may be added within v1 when old readers safely ignore them;
breaking changes or new required fields must bump `formatVersion` and be logged in
`NEW-VERSIONS-PLAN.md`.

## File

- Extension `.json`, UTF-8, no BOM.
- Filename `zakat-backup-YYYY-MM-DD.json`. Date is the export date in the device's local time.
- Pretty-printed with two-space indent, so a curious user can open it and read it.

## Envelope

```json
{
  "app": "zakat-calculator",
  "formatVersion": 1,
  "exportedAt": "2026-08-19T09:14:22.000Z",
  "exportedFrom": { "platform": "android", "appVersion": "1.0.4" },
  "data": { }
}
```

`app` and `formatVersion` are the guard. An import must refuse a file whose `app` is not
`zakat-calculator`, and refuse a `formatVersion` greater than it understands, telling the user to
update the app rather than silently dropping the fields it cannot read. A lower version is
readable: absent fields fall back to defaults.

`exportedFrom` exists for support, not logic. Never branch on it.

## data

`data` mirrors the persisted app state, minus anything derived or transient:

| Key | Type | Notes |
| --- | --- | --- |
| `settings` | object | Language, currency, Nisab standard, anniversary, theme. `onboarded` and `hasSeenLearn` are **excluded**: they describe this install, not the user's data. |
| `entries` | array | Category entries exactly as stored. |
| `deductions` | array | As stored. |
| `prices` | object | Gold and silver prices with their fetch timestamp. Restored, then refreshed on next launch, so a stale backup does not pin old prices. |
| `history` | array | Saved calculations, each with its `input` and `result`. A record may also carry optional `payments`; old records without it read as an empty payment list. |

`fx` is **excluded**. Exchange rates are fetched and cached; restoring month-old rates would
silently change converted totals. It refetches.

## Import rules

These are behavioural, so both platforms must match or a cross-platform restore will surprise
the user.

1. **Validate before touching anything.** A malformed file changes nothing. Report which check
   failed in the user's language.
2. **History merges, it does not replace.** Match on calculation `id`. Immutable calculation facts
   keep local precedence. For an existing calculation, merge its optional `payments` separately by
   stable payment id and keep the copy with the later `updatedAt`, including deletion tombstones.
   For records without payments, importing the same file twice remains a no-op. Records are
   re-sorted newest first after the merge.
3. **Entries, deductions and settings replace.** These represent one in-progress calculation and
   one set of preferences; merging them would produce a state the user never had. The confirm
   prompt must say plainly that the current numbers will be replaced, and how many history
   records will be added.
4. **Never import `onboarded`.** A restore must not throw a returning user back into onboarding,
   nor skip it for someone who has not seen it.
5. **Unknown fields are ignored, not an error.** A file from a newer minor build with an extra
   key still imports.

## Optional payment records, added to format v1 on 27 Aug 2026

Payment tracking is attached to an exact saved calculation and does not alter its original
`input`, `result`, `savedAt` or currency:

```ts
interface ZakatPayment {
  id: string;
  name: string;
  amount: number;
  paidAt: string; // ISO 8601 date and time
  updatedAt: string; // ISO 8601, conflict resolution
  deletedAt?: string; // hidden tombstone retained for sync
}

interface SavedCalculation {
  // Existing fields unchanged.
  payments?: ZakatPayment[];
}
```

The format stays at version 1 because `payments` is optional, old files remain valid and old
readers already ignore unknown fields. A newer reader must validate payment names, positive finite
raw amounts and ISO timestamps before applying them. A backup replacement restores payments and
tombstones exactly. A merge keeps local immutable calculation facts and reconciles payments by id
and latest `updatedAt`. See `PAYMENT-TRACKER-SPEC.md` for UI, arithmetic and acceptance tests.

## Automatic sync, which is separate

The manual file above is the cross-platform path. Automatic sync is per-platform and invisible:

- **Android**: Android Auto Backup. The OS backs up app data to the user's Google account and
  restores it when they reinstall or set up a new phone. Nothing to build beyond allowing it and
  excluding what should not travel.
- **iOS**: iCloud key-value store, per the iOS session's research.

Neither route sends anything to us. Both are the user's own cloud account.
