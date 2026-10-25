# Verification and acceptance tests

Automated commands:

```powershell
# backend/functions
npm test
npm run test:emulator
# mobile-app
npm run typecheck
npm run lint
npx expo export --platform android --output-dir dist-android
# admin-dashboard
npm run build
# instagram-automation (requests must be installed)
python -m unittest -v test_worker.py
```

Backend unit tests cover invalid/duplicate cart lines, integer quantities, delivery thresholds, HMAC and address allowlisting. Emulator tests cover role escalation, cross-user access, direct order writes, trusted retail/wholesale quotes, concurrent replay of one payment, competing orders for the last stock unit, payment amount/ownership mismatch, and dealer review using the stored applicant. The emulator tests stub the Razorpay SDK; they do not demonstrate a real payment gateway call.

Worker tests use an in-memory SQLite journal and stub provider calls. They cover malformed data, duplicate IDs, eligibility, resuming failures, Sheets-write recovery after publication and uncertain-publish blocking. They do not publish any real Instagram posts.

Manual acceptance after configuration:

1. Register a customer, reject invalid input, relaunch the APK to confirm persistent auth, reset password and sign out. Ensure switching users does not expose another user's cart.
2. Seed catalog; search every category, sort prices, open detail/zoom and add/update/remove cart items. Exercise offline, empty and out-of-stock states.
3. Edit profile; create/edit/delete addresses, set default and select another saved address at checkout. Configure locality search, select a result and verify the OSM location.
4. Use Razorpay **test mode** automatic capture. Test success, failure and cancellation. Compare the Razorpay captured amount with server order totals including delivery. Retry confirmation and ensure one order/stock deduction. Verify orders, details and tracking across relaunches.
5. Apply as dealer; attempt dealer login before approval; approve via admin; refresh/sign in, confirm wholesale card/cart prices and server quote. Try an unapproved/fabricated role and ensure retail pricing/access remains enforced.
6. Book a future service with contact/address/slot. Confirm history; assign a technician through admin, progress service and verify customer updates. Test forbidden transitions and unauthorized access.
7. Enable push on a physical Android device, put the app in background, confirm an order/update and receive FCM. Inspect the inbox if push fails. Test email/SMS separately if configured.
8. In the admin dashboard, test sign-in denial for a customer, search/filter/detail views, status changes, dealer approval/rejection, service assignment/notes and responsive layouts.
9. Import n8n workflow, configure the worker header credential and use a verified test row. Trigger twice: one publish only. Simulate quota errors, processing delay, a Sheets failure after publication and an uncertain publish response. Inspect journal and Sheet statuses. Verify timezone and 10:00 IST daily activation.
10. Rotate/renew Instagram long-lived token, verify correct permissions/account, confirm image is publicly accessible JPEG and review the caption/illustration for invented claims before enabling unattended runs.

Record provider response IDs, screenshots and dates in `verification-report.md`. Do not mark a live feature verified based only on types or a mocked test.
