# Email, SMS and push notifications

Every confirmed order, order status change, dealer decision, service request and service status change writes an inbox message. Its Firestore create trigger attempts FCM and optional email/SMS delivery. Provider failures are recorded as status values instead of leaking provider responses or rolling back business operations.

For EmailJS, connect an email service and create a template with dynamic recipient `{{to_email}}`, recipient name `{{to_name}}`, subject `{{subject}}` and body `{{message}}`. In backend environment set `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID` and `EMAILJS_PUBLIC_KEY`. Enable the appropriate server/API settings in the provider account and provision the private key:

```powershell
npx firebase functions:secrets:set EMAILJS_PRIVATE_KEY --config ../firebase.json
```

For TextBee, install the official gateway app on a secondary Android phone, pair it with the TextBee dashboard and retain a valid SIM/SMS plan. Set `TEXTBEE_DEVICE_ID` on the backend and provision:

```powershell
npx firebase functions:secrets:set TEXTBEE_API_KEY --config ../firebase.json
```

Redeploy functions after enabling/disabling these environment variables: the notification function binds provider secrets only for enabled services at deployment. Do not place either private key in the app, dashboard or Git. Leave provider IDs blank to disable delivery without changing order processing. Tests stub both provider requests; no real email/SMS has been sent.

[EmailJS's API](https://www.emailjs.com/docs/rest-api/send/) accepts the implemented template payload and documents a 1 request/second limit. Its [free plan](https://www.emailjs.com/docs/faq/can-i-use-emailjs-for-free/) has account quotas/features that must be checked in the configured account. A provider refusal or rate limit is recorded as `failed:<status>`; this implementation does not promise guaranteed delivery or silently retry a possibly accepted SMS.

[TextBee](https://github.com/textbee/textbee) uses your phone/SIM, so its free hosted gateway does not make carrier SMS free. Verify that your carrier plan covers messages before enabling. The adapter currently addresses Indian 10-digit mobile numbers with +91.

FCM setup is documented in `firebase-setup.md`. The inbox works independently of push permission or carrier delivery. Physical-device delivery, provider quotas and credentials need explicit acceptance testing before submission.
