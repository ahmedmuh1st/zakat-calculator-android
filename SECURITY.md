# Security Policy

## Supported version

Security fixes are applied to the latest source snapshot. Older public snapshots are references,
not maintained release branches.

## Reporting a vulnerability

Use the repository's **Security** tab to open a private GitHub security advisory. Include the
affected version, a concise reproduction, expected impact and any proposed mitigation. Do not put
credentials, private backup files, payment records or personally identifiable information in a
public issue.

If private advisories are unavailable on a mirror, contact that mirror's maintainer through its
documented private channel. There is no public application backend holding user calculations.

## Secrets

Never commit `.env` files, Android keystores, Apple signing files, Expo tokens, Google Play service
accounts or cloud credentials. If a secret is committed, revoke and replace it; deleting it from
the latest commit is not sufficient because Git history preserves earlier versions.
