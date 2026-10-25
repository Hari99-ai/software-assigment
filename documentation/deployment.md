# Deployment

## Android

In `mobile-app`, copy `.env.example` to `.env`, set Firebase configuration and the public Razorpay test key, then:

```powershell
npm ci
npm run typecheck
npm run lint
npx expo start --dev-client
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

The preview profile produces an installable APK; production produces an AAB. Razorpay is a native module, so create a development/preview build rather than relying on Expo Go. `npx expo export --platform android --output-dir dist-android` verifies bundling but does not build, sign or install an APK. EAS account/project configuration, Android signing and FCM configuration remain account-owner steps. EAS free build availability/queue limits apply; local Android SDK builds are an alternative when Android Studio is available.

## Admin on Vercel

Deploy the existing `admin-dashboard` directory as a Vite project; do not change its backend to a different hosting platform. In Vercel import the repository, set root directory `water-purifier-project/admin-dashboard`, build command `npm run build`, output `dist`, and Node 22. Set the `VITE_FIREBASE_*` values from `.env.example`. These are public Firebase application identifiers, not server secrets. Disable `VITE_USE_EMULATORS`. `vercel.json` provides SPA routing.

Add the resulting Vercel hostname to Firebase Authentication authorized domains if needed, deploy Firestore rules/indexes and backend functions, provision an administrator with the trusted script, then sign in. Verify orders, dealer approvals and service transitions against the deployed backend. An admin UI gate alone never grants data access.

Alternatively run `npx vercel` from the admin directory using your authenticated Vercel account, then `npx vercel --prod` after review. No deployment is claimed without a returned Vercel URL and live checks. This workspace has no configured Vercel project/account credentials.

## Instagram

Follow `instagram-automation/README.md`. Keep Docker running, host awake, volumes intact, token renewal functional and n8n workflow active. Docker Desktop is not installed in the currently inspected environment, so Compose launch/import has to be verified after installing it. Do not expose the worker publicly. n8n binds only to local loopback.
