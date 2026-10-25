# Trusted Firebase backend

Cloud Functions use Node 22 and run in `asia-south1`. Firestore rules, composite indexes and emulator configuration are included. Install dependencies in `functions` using `npm ci`; run `npm test` and `npm run test:emulator` there. `npm run seed` writes the 51-product sample catalog using Admin SDK credentials or the configured emulator; it replaces fixture product documents, so use a test project first.

See [Firebase setup](../documentation/firebase-setup.md), [architecture](../documentation/architecture.md), [notifications](../documentation/notifications.md) and [testing](../documentation/testing.md).

For a disposable demonstration, start Auth/Firestore emulators with project `demo-aquapure`, set `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` and `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, build, then run `node scripts/seed-demo.cjs` from `functions`. It refuses to run without both emulator variables. Local accounts are `admin@example.test`, `customer@example.test`, `dealer@example.test`, with password `AquaPureDemo2026!` unless `DEMO_PASSWORD` is supplied. These are test-only fixtures, not real accounts or credentials for a deployed project.

Payment verification uses both HMAC and a captured payment lookup. Transactional fulfillment is idempotent and never decrements stock below zero. Inventory is not reserved while payment is in progress; last-unit contention or a lost app response can require support/refund reconciliation. Automatic refunds and payment webhooks are not implemented. Never switch to live Razorpay keys before addressing operational reconciliation and completing acceptance tests.
