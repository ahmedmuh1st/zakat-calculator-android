# Contributing

Contributions are welcome when they preserve the application's privacy, calculation integrity and
cross-platform data contracts.

## Before opening a pull request

Explain the user problem first. Keep unrelated changes separate, add deterministic tests for any
arithmetic or persistence change, and run `pnpm check` plus `pnpm test`.

| Requirement | Expected behavior |
|---|---|
| Privacy | No analytics, ads, account requirement or developer-controlled storage of user calculations |
| Calculation | Financial values reconcile to the displayed final total at cent accuracy |
| Arabic | RTL layout and Arabic copy are reviewed as primary behavior |
| Locales | Every dictionary contains every required key; do not leave untranslated English strings |
| Backup | Existing version 1 files remain readable; payments merge by stable payment ID and timestamps |
| Copy | Use clear language and do not use em dashes in application text |
| UI | Verify phone and wide/foldable layouts; avoid placeholder data |

Do not include real backup files, production credentials, store screenshots containing account
details or internal publishing notes. New dependencies need a clear runtime purpose and should be
compatible with the project's Expo SDK version.
