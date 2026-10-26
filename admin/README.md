# Swa Marketplace admin app

The admin app provides marketplace analytics, member suspension/restoration, clothing-listing moderation, active swap monitoring, and dispute resolution.

## Run locally

1. Set `VITE_BACKEND_URL` in `admin/.env` to the backend URL (for example, `http://localhost:4000`).
2. Set `VITE_STORE_URL` to the storefront URL if it differs from `http://localhost:5173`.
3. Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `JWT_SECRET` in `backend/.env`.
4. From `admin`, run `npm run dev` and sign in with the configured admin account.

Suspending a member prevents new authenticated actions while preserving their account and exchange history. Removing a reserved listing cancels its active exchange and releases the other reserved item.
