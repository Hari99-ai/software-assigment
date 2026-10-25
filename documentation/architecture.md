# Architecture and implementation plan

The Android application uses Expo SDK 58, React Native, TypeScript and Expo Router. Firebase Authentication persists the native session through AsyncStorage. Firestore stores profiles, products, orders, service bookings, dealer applications and notification inboxes. Cart state is isolated by UID in device storage and is treated as untrusted at checkout.

The React/Vite admin dashboard authenticates with Firebase and subscribes to Firestore. Both rules and callable functions check the protected `users/{uid}.role` field. No client can create a dealer/admin role or write an order. Administrator provisioning is a separate Admin SDK script requiring project-owner credentials.

Trusted functions run in `asia-south1`. A quote ignores client prices, validates integer quantities, loads product prices and dealer approval from Firestore and calculates delivery in paise. Razorpay creates a payment order; the app opens native checkout. Confirmation validates HMAC, retrieves captured payment from Razorpay, checks order ID/currency/amount, and atomically writes an order, deducts stock and creates a notification. The Razorpay order ID is the fulfillment document ID, making confirmation retries idempotent.

Notification documents form a durable inbox. A Firestore trigger attempts FCM delivery; failed push does not undo an order. Service creation generates a confirmation inbox message. Admin status updates append audit history and enqueue notification messages. Email/SMS delivery is a separate configurable adapter when enabled; see Firebase setup.

Collection structure:

| Path | Purpose | Client writes |
| --- | --- | --- |
| `users/{uid}` | Profile, protected role/approval, addresses, FCM token | Own safe profile fields only |
| `products/{id}` | Catalog, retail/wholesale prices, stock, imagery/specifications | None; trusted seeder |
| `carts/{uid}` | Reserved for a future shared cart | Own cart only; current app uses device storage |
| `pendingOrders/{razorpayOrderId}` | Trusted payment quote | None |
| `orders/{razorpayOrderId}` | Verified fulfillment, prices, address and status history | None |
| `dealerApplications/{uid}` | One dealer application per account | Create own pending application only |
| `serviceBookings/{id}` | Requested slot/contact/address, assignment and status history | Own pending booking creation only |
| `notifications/{uid}/messages/{id}` | Inbox/outbox | Owner may mark read |
| `geocodeCache/{hash}`, `internal/geocoderRate` | Optional server place-search cache/rate gate | None |

Instagram runs in local Docker: an n8n schedule calls a private Python worker. The worker reads Google Sheets, generates a caption with Groq and an illustration with local AUTOMATIC1111 or Hugging Face, uploads JPEG to Cloudinary, creates/polls/publishes an Instagram media container and updates Sheets. SQLite persists selection, generated assets, publish intent and result before subsequent side effects. A single worker replica and persistent volume are required. A lost publishing response is explicitly blocked for reconciliation, because retrying a non-idempotent external API cannot guarantee exactly-once publishing.

Milestones: (1) repair checkout/security and build mobile; (2) implement admin operations and profiles/history; (3) build/test publishing worker and n8n workflow; (4) seed relevant catalog and provide setup/test/deployment evidence; (5) configure external accounts and run live acceptance tests.

Material limits: stock is rechecked at confirmation but is not reserved during payment. A last-unit race can leave one captured payment needing manual refund/fulfillment. Payment capture must be automatic in the Razorpay dashboard. No refund or webhook reconciliation is claimed. Public launch requires resolving these operational cases, reviewing provider quotas and completing the external acceptance checks.
