# AquaPure operations

React/TypeScript/Vite dashboard with Firebase email/password authentication, protected admin access, live order/service/dealer data, search/filter/details, audited status changes, dealer approvals/rejections/access changes and technician assignment/notes.

Copy `.env.example` to `.env.local`, configure Firebase, run `npm ci`, then `npm run dev`. Run `npm run build` to verify production output. The Vercel root is this directory and output is `dist`; see [deployment](../documentation/deployment.md). Never deploy with `VITE_USE_EMULATORS=true`.

The local `.env.local` created during development uses only the `demo-aquapure` emulator project. Replace/remove it for production. Provision an administrator using the trusted backend script. A role passed from the browser cannot grant access.

Overview counts/amounts cover the 500 most recent loaded records in each collection, as stated in the UI. Captured-order value is not a refund-adjusted accounting report. No live Vercel deployment or browser screenshot is claimed without verification evidence.
