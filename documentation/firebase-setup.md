# Firebase setup

Use Node 22, npm and Java 21+ for local Firestore tests. Install dependencies separately in `mobile-app`, `admin-dashboard` and `backend/functions` using `npm install` (or `npm ci` after lockfiles are present). Firebase CLI is installed with backend development dependencies.

Create a Firebase project, enable Email/Password Authentication, create Firestore in production mode, and register web and Android applications. Copy web configuration into the respective `.env.example` files. These Firebase web identifiers are public configuration; Firestore rules provide authorization. Do not put Admin SDK credentials, Razorpay secrets, Instagram tokens or Cloudinary secrets in an `EXPO_PUBLIC_` or `VITE_` variable.

From `backend/functions`:

```powershell
npx firebase login
npx firebase use --add --config ../firebase.json
npx firebase functions:secrets:set RAZORPAY_KEY_SECRET --config ../firebase.json
npm run build
npx firebase deploy --config ../firebase.json --only firestore:rules,firestore:indexes,functions
```

Copy `backend/functions/.env.example` to `.env.<your-project-id>` and set `RAZORPAY_KEY_ID` to the test key ID. Set the secret through Secret Manager. Local emulators can use an ignored `.secret.local` file containing the test secret. Never commit it.

For FCM, download your Android app's `google-services.json` from Firebase into the ignored mobile root. Set `expo.android.googleServicesFile` in `app.json` to `./google-services.json`, configure Android FCM credentials with EAS, and create a fresh Android development build. Open the Notifications screen and choose to enable notifications. The app creates the Android channel, requests permission, obtains the native FCM token and saves it to its own profile. Remote push requires a physical device/development build; it is not verified by a JavaScript bundle export or Expo Go.

Create an administrator account in Firebase Authentication, find its UID, then run with Application Default Credentials belonging to a trusted project administrator:

```powershell
node scripts/bootstrap-admin.cjs <existing-firebase-auth-uid>
```

The script lives in `backend/functions`. Do not expose it as an API. It looks up the actual Auth user before setting the protected profile role. Customer registration always creates `role: customer`; dealer approval happens through trusted functions and resolves the applicant from the stored application.

Local development does not need a paid Firebase plan:

```powershell
cd backend/functions
npm run test:emulator
npx firebase emulators:start --config ../firebase.json --project demo-aquapure --only auth,firestore,functions
```

Use the `EXPO_PUBLIC_USE_EMULATORS`/`VITE_USE_EMULATORS` switches. Android emulator reaches the host at `10.0.2.2`; a physical phone needs your computer's LAN IP and reachable emulator listeners. Default loopback bindings are suitable for the web admin. Production configuration must disable emulator switches.

Optional maps: set `GEOCODER_BASE_URL` to a self-hosted Nominatim-compatible endpoint and provide an identifying user agent. Place search is manually triggered, restricted to India, cached and globally gated. Manual delivery-address entry works without it. No public Nominatim endpoint is built in: the [OSMF policy](https://operations.osmfoundation.org/policies/nominatim/) restricts generated generic services, prohibits autocomplete and personal-data submission, and limits an application's total public traffic. Choose/operate a compliant service explicitly.

Cloud Functions deployment requires the Blaze plan and billing activation. Its no-cost allowance is not a guarantee of zero charges; local emulators avoid cloud deployment charges. See [Firebase pricing](https://firebase.google.com/pricing). Secret Manager, builds, artifact storage, reads/writes and network usage have separate applicable limits.
