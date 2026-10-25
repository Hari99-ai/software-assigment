# Assignment requirement checklist

Status legend: **Implemented** means source is present; it does not imply a real provider/device was tested. **Local verified** means a build, unit test or emulator check ran. **Configuration required** identifies external accounts/services. See the separate verification report for results and limitations.

| Requirement | Implementation | Verification / remaining work |
| --- | --- | --- |
| Android-compatible TypeScript app | `mobile-app`, Expo 58 / Expo Router | Typecheck, lint, Android/Web JS exports; signed APK and device acceptance pending EAS/Android setup |
| Customer email/password registration, login, validation, reset, logout, persistent auth | `context/AuthContext`, auth screens, Firebase config | Source and bundle checks; real Firebase/session acceptance pending configuration |
| Separate approved-dealer login experience | Dealer sign-in mode in Login screen; backend role checks | Dealer quote/role behavior verified with emulator; native login acceptance pending |
| Dealer application, approval/rejection and account management | UID-keyed applications; admin review and `setDealerAccess` | Backend authorization and review/revocation tested with emulator |
| Trusted wholesale prices and bulk quantities | Server quote reads role/approval and product prices; quantity controls | Tampered prices, unapproved dealer and wholesale calculations tested |
| At least 50 products in all five categories | 51 in `backend/functions/src/catalog.json` | Catalog unit test validates completeness, uniqueness, categories, prices and saved image files |
| Unique ID, name, category, brand, description, price, stock/availability, specs | Manufacturer-based metadata and explicit fixture pricing/stock | 51 complete sample records; source/fixture distinctions documented |
| Matching realistic product imagery | 51 saved manufacturer images; ID-based native image mapping | Files downloaded; source association recorded; visual browser/device review and commercial rights not claimed |
| Search, categories, price sorting and detail screens | Products/Search/Home/ProductDetail | Typechecked/bundled; Firebase catalog acceptance pending seed/index deployment |
| Loading, empty and error states | Catalog, history, admin snapshots, forms and provider error handling | Source checks; manual offline/latency acceptance listed in testing guide |
| Cart add/update/remove, subtotal/total and persistence | UID-scoped AsyncStorage CartProvider; cart screen | Source checks; backend independently validates stock/quantities/prices |
| Stock validation before quote and confirmation | Trusted quote plus atomic fulfillment transaction | Replay and last-unit contention tested; no overselling; captured last-unit failures require manual reconciliation |
| Delivery/contact collection and saved-address selection | Checkout and editable/default saved addresses | Typechecked; device acceptance pending |
| Map/place integration | Explicitly configured backend geocoder; locality selection and OSM link | Endpoint/operator configuration required; no silent public Nominatim dependency |
| Razorpay test checkout, success/failure/cancellation handling | Native payment module, checkout screen and trusted callables | HMAC/captured amount/currency/ownership tested with stubbed gateway + real Firestore emulator; real Razorpay test capture pending credentials |
| Never expose payment secrets | Secret Manager backend; public test key only in client | Source reviewed; no real provider secrets included |
| Create order after payment verification | `verifyAndCreateOrder`, deterministic document ID, transaction | Repeated/concurrent verification and amount/ownership mismatch tested |
| Confirmation, order history/details, payment/delivery information and tracking | Confirmation screen, Orders, live OrderDetail | Source/bundle checks; deployed backend/device acceptance pending |
| Dealer catalog, bulk ordering, dealer history/tracking | Shared catalog/cart/orders with role-aware prices and backend quote | Backend dealer pricing tests; device acceptance pending |
| Service types, purifier/contact/address/slot/date, confirmation/history/tracking | ServiceBooking, ServiceHistory; Firestore creation trigger | Rules validate future complete request; admin assignment/history tested; device acceptance pending |
| Profile view/edit and address add/edit/delete/default, histories/logout | Profile/EditProfile/Addresses screens | Typecheck/bundle; real session acceptance pending |
| Push permission and FCM registration | Notifications screen, native token, Android channel | Physical Android/FCM project configuration required; delivery not claimed |
| Order/service/dealer notification inboxes and events | Durable Firestore messages and delivery trigger | Transaction outbox checked with emulator; real trigger/push delivery pending deployment |
| Email/SMS notifications | Backend EmailJS/TextBee adapters and Secret Manager bindings | Adapter payload/failure tests pass with stubs; provider/account/carrier setup and real delivery pending |
| Responsive professional admin dashboard | React/Vite, overview, pipeline, record table, filters, detail drawer | Production build passes; browser capture blocked by URL-verification gate |
| Secure admin auth and authorization | Protected profile role; admin-only functions/rules; trusted bootstrap script | Escalation, unauthorized reads/writes and privileged backend actions tested |
| All order types, details, search/filter/status/audit | Admin Orders + backend transitions | Audit and invalid transitions tested; browser/live acceptance pending |
| Dealer application visibility, decisions and permissions | Admin Dealers + review/access callables | Backend tests cover stored applicant identity and role changes |
| Service assignment, notes/status/audit and customer updates | Service desk + backend transitions/outbox | Required technician and audited transition checks tested |
| Stats, recent orders, pending services/dealers | Admin Overview | Derived from up to 500 recent records per collection; limited scope disclosed in UI |
| Live Vercel dashboard | `vercel.json`, deployment guide | Configuration required: Vercel project/account and real Firebase backend. No live URL claimed |
| Firebase collection architecture, rules, indexes and trusted operations | `backend`, architecture/setup docs | Rules tested in emulator; index definitions include available/category/sort combinations; production deployment pending |
| Daily one-product schedule and intended timezone | Importable `workflow.json`, 10:00 Asia/Kolkata | JSON present; Docker/n8n import and activated schedule require environment setup |
| Google Sheets schema/status/schedule/caption/permalink/errors | `product-template.csv`, 51-row `products.csv`, Sheets client | Worker tests; real sheet/service-account authorization pending |
| Select eligible unpublished product; missing data/duplicates handled | Worker validation/selection and SQLite journal | Eligibility/invalid/duplicate tests; invalid rows receive failure details |
| AI image generation relevant to product and public hosting | Local Stable Diffusion or HF adapter; Cloudinary JPEG upload/check | Implemented; local model/API or HF credits + Cloudinary account required; no generated post image claimed tested |
| AI caption, name/facts/INR price/CTA/hashtags | Groq prompt and caption validation | Provider integration implemented; real generation/grounding review pending credentials |
| Container creation, processing poll, publication and post URL | Instagram Login Graph API flow in worker | Implemented; professional account, Meta app/scopes/token required; no real Instagram publish claimed |
| Retries, rate-limit errors, duplicate prevention, failure retention and logging | Safe-read/Sheets retries, n8n retries, durable SQLite checkpoints | Seven local tests cover core recovery; ambiguous publish outcomes stop for reconciliation |
| Error notification | Optional private ntfy topic | Configurable; no real message sent |
| Account type, Meta app/permissions, tokens/renewal, public-image API guide | Automation README; long-lived token refresh code | Documented/implemented; real OAuth/renewal acceptance pending account setup |
| Importable workflow, Compose, prompt templates, env examples and execution guide | `instagram-automation` files | Worker tests pass; Docker not installed in inspected environment |
| Clean structure and business/UI separation | Services/contexts, backend validators/adapters, admin Firebase boundary, worker | TypeScript/React/CSS source formatted; lockfiles included |
| Relevant free tiers and unavoidable costs | Architecture/setup/automation/notification docs | Provider references checked; Functions requires billing; AI credits/SMS/device and hosting quotas disclosed |
| Install/start/build/deploy/test documentation | Root and per-project READMEs + documentation | Present, with local vs real-provider verification distinguished |
| Screenshots demonstrating features | `documentation/screenshots/README.md` | Blocked: computer-use tool could not verify browser URL and stopped. No fabricated screenshots |
| Bonus image zoom | ProductDetail image modal | Implemented/bundled; gesture/device review pending |
| Bonus WhatsApp Status, referrals, app-wide dark mode | Not implemented | Optional; no unsupported WAHA operation or nonfunctional toggle is claimed |

The assignment is not yet ready to claim as fully deployed/live-tested. Complete the configuration and acceptance rows before submission as an end-to-end production demonstration.
