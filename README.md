# AquaPure — Califnco technical assignment

Android commerce source, Firebase backend, React admin operations dashboard and daily Instagram publishing automation. Customer/dealer workflows and privileged operations are implemented in source. Cloud deployment, real payment capture, physical-device notifications and Instagram publishing require the account configuration and acceptance checks below; they are not represented as live-tested.

| Directory | Implementation |
| --- | --- |
| `mobile-app` | Expo 58, React Native, TypeScript, Expo Router; catalog, cart, checkout, profile/addresses, orders, services, dealer login and inbox |
| `admin-dashboard` | React/Vite dashboard; protected login, orders, dealer reviews/access, service assignment/status/history |
| `backend` | Node 22 Firebase functions, Firestore rules/indexes, payment verification, notification adapters, scripts and emulator tests |
| `instagram-automation` | Importable n8n workflow, Docker Compose, Python publishing worker, SQLite recovery, Sheets templates and AI prompt templates |
| `documentation` | Architecture, provider setup, deployment, testing, catalog provenance and requirement checklist |

The catalog includes **51 products and 51 matching manufacturer images** across purifiers (16), dispensers (5), pumps (8), filters/cartridges (12) and spare parts (10). Images are bundled for Android; product provenance is retained. Prices and stock are demonstration fixtures, described in [catalog sources](documentation/catalog-sources.md).

## Run locally

Use Node 22/npm, Python 3.12 and Java 21+ for emulator testing. Install separately with `npm ci` in `mobile-app`, `admin-dashboard` and `backend/functions`. Root `npm ci` installs only the formatter. Copy each relevant `.env.example` to its documented environment file; never paste server secrets into public client variables.

```powershell
# Mobile — configure Firebase/public Razorpay key first
cd mobile-app
npx expo start --dev-client
# Requires an Android development build for native Razorpay / push.

# Admin — separate terminal, configure Firebase first
cd admin-dashboard
npm run dev

# Trusted backend tests — separate terminal
cd backend/functions
npm test
npm run test:emulator

# Automation logic tests — separate terminal
cd instagram-automation
python -m pip install requests
python -m unittest -v test_worker.py
```

Paths in these examples start from the project root. The root `npm run verify` runs unit tests, mobile checks, admin build and automation tests after subproject dependencies are installed. `npm run format` formats TypeScript/React/CSS sources.

For a completely local demonstration use the Auth/Firestore emulator configuration and guarded `seed-demo.cjs` script in [backend setup](backend/README.md). The checked local admin environment uses the demo project only. If port 8080 is occupied, choose an unused Firestore port in `backend/firebase.json` and update emulator client ports consistently; do not terminate unrelated processes.

## Configure and deploy

- [Architecture and implementation plan](documentation/architecture.md)
- [Firebase, protected administrator provisioning and FCM](documentation/firebase-setup.md)
- [EmailJS and TextBee](documentation/notifications.md)
- [Android APK/AAB, Vercel and backend deployment](documentation/deployment.md)
- [Instagram accounts, Docker, Google Sheets, AI providers and activation](instagram-automation/README.md)
- [Testing and manual acceptance](documentation/testing.md)
- [Verification report](documentation/verification-report.md)
- [Requirement checklist](documentation/submission-checklist.md)

Production Firebase Functions needs billing activation. Local emulators avoid that requirement. Hosted image generation has credit limits; a local Stable Diffusion API is supported as a no-paid-provider alternative. TextBee still uses your carrier's SMS plan. Provider account quotas and model availability must be checked at configuration time.

Remaining external steps are explicit in the checklist: Vercel/Firebase deployment credentials, Razorpay test account/capture, EAS signing/build, Android FCM, chosen geocoding service, email/SMS accounts and Instagram/Sheets/AI authorization. Docker is unavailable in the inspected environment. Browser screenshot capture was blocked by the computer-use tool's URL-verification check; no screenshots are fabricated. Optional WhatsApp status/referrals/dark mode are not claimed.
