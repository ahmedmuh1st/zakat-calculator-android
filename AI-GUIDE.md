# AI Coding Guide

This guide gives AI coding agents the minimum context required to extend Zakat Calculator safely.

## Mission

Build a clear, warm and spiritually respectful Zakat calculator. The app is a charitable project,
free of ads, accounts, analytics and developer-operated user-data storage.

## Product rules

1. All calculations run on device.
2. User records remain local unless the user uses Android system backup to the user's own Google account or exports a manual backup file.
3. Arabic and Urdu RTL are first class. Direction comes from `lib/i18n/locales.ts`.
4. English, Arabic, Indonesian, Urdu, Bengali, Turkish and French must keep identical keys.
5. Silver is the default Nisab standard for new users; saved preferences win on upgrade.
6. Category rows show gross Zakat at the stated rate. Shared deductions appear once as a separate negative Zakat adjustment.
7. Payment records belong to one saved calculation. Never mix yearly obligations.
8. English and Arabic release notes must be written before any store build.

## Important paths

| Path | Responsibility |
|---|---|
| `lib/zakat/engine.ts` | Core Zakat calculations |
| `lib/zakat/types.ts` | Shared domain model |
| `lib/zakat/payments.ts` | Payment totals and merge semantics |
| `lib/zakat/breakdown.ts` | Backward-compatible History reconstruction |
| `lib/backup/format.ts` | Portable backup format and History reconciliation |
| `lib/store.tsx` | Local persistence and personal-cloud synchronization |
| `lib/i18n/` | Locale registry and dictionaries |
| `app/summary.tsx` | Current result and payment tracker |
| `app/(tabs)/history.tsx` | Saved calculations and payment management |
| `app/(tabs)/index.tsx` | Home dashboard and active payment-progress entry |

## Safe extension points

New categories belong in domain types, engine, category metadata, every locale dictionary and tests.
New saved data requires a deterministic merge rule before entering personal-cloud sync or backup files.
Do not add a backend, account system, analytics SDK or advertising SDK. Do not enable native global RTL
while manual mirroring remains. Do not change the backup schema without a reader for older files.

## Required checks

```bash
pnpm lint
pnpm test
pnpm check
```

For calculation work, add a fixture using exact holdings, deductions and expected totals. For UI work,
verify Android phone portrait, a large or foldable layout, Arabic RTL and a low-value currency with long numbers.

## Secret handling

Never inspect, print, commit or copy real signing credentials into public output. Public packages use
placeholder configuration and developer-owned application identifiers. The release-gated exporter must
fail closed and preserve the previous public package when checks fail.
