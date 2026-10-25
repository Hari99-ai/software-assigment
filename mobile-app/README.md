# AquaPure Android application

Expo SDK 58 / React Native / TypeScript / Expo Router. Customer and approved-dealer catalog, local persisted carts, native Razorpay checkout, profile/addresses, orders/tracking, service booking/history, inbox and opt-in FCM registration are implemented.

Copy `.env.example` to `.env`, fill Firebase/public Razorpay test identifiers, run `npm ci` and `npx expo start --dev-client`. Use `npm run typecheck`, `npm run lint`, and `npx expo export --platform android --output-dir dist-android` for source checks. See [deployment](../documentation/deployment.md) to build an APK with EAS. A native development/preview build is required for Razorpay and remote push. Web export is available for layout/source checks and does not execute native payments.

51 catalog images are bundled under `assets/catalog`, mapped by product ID in `src/data/catalogImages.ts`. Firestore products must be seeded from the matching backend fixture. The remote URL is a fallback for products outside that fixture. Manufacturer provenance and sample pricing/inventory are documented in [catalog sources](../documentation/catalog-sources.md).

For local emulator testing set the emulator switches/host described in [Firebase setup](../documentation/firebase-setup.md). No production account/API keys are included. Device installation, real Razorpay test capture, remote FCM and configured geocoding remain external acceptance checks.
