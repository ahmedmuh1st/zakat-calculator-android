# Zakat Calculator

**Zakat Calculator** is a privacy-first Expo application for calculating, saving and tracking
Zakat. It supports Android phones, tablets and foldable layouts, with Arabic RTL treated as a
first-class interface rather than a translated afterthought.

The project is published as ongoing charity, **صدقة جارية**, under the
[PolyForm Noncommercial License 1.0.0](LICENSE). You may study it, improve it, build your own
version, and share it **only for non-commercial purposes**. You may not sell it, monetize it,
use it in a paid product or service, or use it with an anticipated commercial application
without a separate written license from the copyright holder. The calculations are an
educational aid and are not a fatwa.

The repository follows the latest validated public release. A release-gated archive and its
SHA-256 fingerprint are also published at [zakat.muhaidib.io](https://zakat.muhaidib.io/#source).

## What is included

| Area | Current implementation |
|---|---|
| Calculation | Nine Zakat categories, gold and silver Nisab standards, shared deductions and truthful category breakdowns |
| Prices | Refreshable gold, silver and foreign-exchange prices with retry and timeout handling |
| History | Named saved calculations, Hijri dates, editable reload and expandable category detail |
| Payments | Per-calculation payment tracking with paid, remaining and extra-paid states |
| Backup | Android Auto Backup plus a portable versioned JSON file that can be restored across platforms |
| Languages | English, Arabic, Indonesian, Urdu, Bengali, Turkish and French |
| Privacy | No accounts, ads or analytics; calculations and saved records remain local except copies controlled by the user through Android backup or manual export |

## Technology

The app uses Expo SDK 54, React Native 0.81, Expo Router 6, TypeScript and Vitest. Runtime data is
stored through AsyncStorage. A generic development server remains in this source because it is
part of the original Expo project template, but the Zakat calculator does not send calculations,
history or payments to it.

## Run locally

Install Node.js 22 and pnpm 9, then run:

```bash
git clone <your-repository-url>
cd zakat-calculator
pnpm install --frozen-lockfile
pnpm dev:metro
```

Open the QR code in Expo Go or press the platform shortcut shown by Expo. The standalone mobile
app does not require environment variables or a server.

For the optional template server and web preview together, copy `.env.example` to `.env`, provide
your own development values, and run `pnpm dev`. Never commit `.env` or production credentials.

## Verify changes

Every contribution should pass:

```bash
pnpm check
pnpm test
```

The test suite covers calculation arithmetic, Nisab behavior, saved history, seven-language
dictionary integrity, backup compatibility, payment merging and known regression cases.

## Build your own app

Forks must choose their own application name, icon, deep-link scheme and Android package ID in
`app.config.ts`. Do not publish a fork with `com.app.zakatcalculator`, which identifies the official
Google Play application. Follow Expo's current Android build guidance for local or EAS builds.[1]

## Data and backup contract

`BACKUP-FORMAT.md` defines the portable JSON contract. `PAYMENT-TRACKER-SPEC.md` defines payment
identity, tombstones and nested merge behavior. Keep these contracts backward compatible so users
can restore earlier copies and transfer between supported platforms.

## Project principles

Changes should keep calculations on-device, preserve Arabic RTL, avoid analytics and advertising,
and show the financial reasoning honestly. See `CONTRIBUTING.md` before opening a pull request.

## License and security

Source and bundled project artwork are provided under the PolyForm Noncommercial License 1.0.0
unless a file states otherwise. See `LICENSE` and `NOTICE`. Commercial use is not permitted
without separate prior written permission. Report vulnerabilities through GitHub's private
security-advisory flow as described in `SECURITY.md`; do not publish secrets or sensitive data
in an issue.

## Public project links

| Resource | URL |
|---|---|
| Source repository | https://github.com/ahmedmuh1st/zakat-calculator-android |
| Validated source archive | https://zakat.muhaidib.io/source/android |
| Product website | https://zakat.muhaidib.io |

## References

[1]: https://docs.expo.dev/build/setup/ "Expo: Create your first build"
[2]: https://docs.expo.dev/versions/v54.0.0/ "Expo SDK 54 documentation"
[3]: https://reactnative.dev/docs/0.81/getting-started-without-a-framework "React Native 0.81 documentation"
