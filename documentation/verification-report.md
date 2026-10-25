# Verification report — 24 October 2026

Local source verification completed in the Windows workspace. No real provider accounts were used to create payments, send messages, publish Instagram posts or deploy production services.

| Check | Observed result |
| --- | --- |
| Backend TypeScript compilation + unit tests | Passed: 7 tests for catalog completeness/images, notification payloads/failures, cart/price/address validation and HMAC |
| Firestore emulator integration/security suite | Passed: 8 tests covering escalation/cross-user writes, trusted pricing, concurrent payment replay, last-unit contention, amount/ownership mismatch, dealer approval/revocation, service request validation and audited admin transitions |
| Instagram worker unit tests | Passed: 7 tests covering validation/eligibility, duplicate IDs, old-job recovery, published-result recovery after Sheet failure, uncertain-publish blocking and expired-container retry |
| Mobile TypeScript | Passed `npm run typecheck` |
| Mobile lint | Passed `npm run lint`, no errors or warnings after cleanup |
| Android JavaScript bundle | Final Expo Android export passed: 1,432 modules, 94 assets including the 51 catalog images, ~4.4 MB Hermes bundle. This is not a signed APK |
| Mobile web JavaScript export | Passed; native payment flow is intentionally available only in the Android build |
| Admin TypeScript + Vite production build | Passed; approximately 572 KB main JS before gzip / 176 KB gzip. Vite reports a large-chunk advisory |
| Catalog data/media | 51 unique products, 5 categories, 51 downloaded matching manufacturer image files (~17.5 MB); stock and selling prices are explicit fixtures |
| Workflow/configuration artifacts | Workflow JSON, Firebase configs/rules/index JSON and 51-row/13-column Sheets CSV parsed successfully |

The final emulator run uses a dedicated Firestore test port 18080 through `firebase.test.json`, because the environment could not bind the default 8080. Existing unrelated services were not terminated. Permission-denied log messages in the emulator suite are expected negative test cases; all eight assertions passed. Payment provider calls were stubbed while actual Firestore transactions/rules ran in the emulator.

The local admin server started successfully. Browser interaction was stopped by the computer-use tool because it could not establish the current browser URL for policy enforcement. No UI screenshots or browser acceptance results are claimed. See `screenshots/README.md`.

Not yet verified: signed APK installation/device UX, persistent native login against a configured Firebase project, real Razorpay test capture/cancellation, physical-device FCM, configured geocoding, EmailJS/TextBee delivery, real Sheets OAuth, AI generation/Cloudinary upload, Meta permissions/token refresh/media publish, n8n import/activation and Docker Compose launch, or a live Vercel URL. These require the external setup described in the READMEs. Docker is not installed in the inspected environment.

Operational limitations remain explicit: no payment webhooks or automatic refunds; no inventory reservation during payment; last-unit captured-payment conflicts require support/refund reconciliation. Admin overview totals cover at most 500 recent records per collection. Instagram unknown publish outcomes stop for reconciliation rather than risk duplicate posting. Manufacturer media rights and product/fixture data require review before commercial deployment.
