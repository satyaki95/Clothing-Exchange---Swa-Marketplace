# Swa Marketplace web app

The customer app supports account registration and sign-in, member profiles, clothing listings, swap requests, negotiation messages, value estimates, and location-based discovery. The existing resale storefront remains available under **Shop**.

## Run locally

1. Set `VITE_BACKEND_URL` in `frontend/.env` to the backend URL (for example, `http://localhost:4000`).
2. From `frontend`, run `npm run dev`.
3. Use **Swap Closet** to browse and filter community listings. Sign in to publish an item, send requests, message members, and manage your wardrobe.
4. Add a city in **My Profile** for city-based discovery. Add latitude and longitude (or use the browser location button) to enable radius-based nearby matches.
5. Open a community listing for details, then request a swap or buy it using cash on delivery, Razorpay, or Stripe. Purchases use the estimated value plus the ₹10 delivery fee.
6. Follow listing purchases under **Orders**. The listing owner can open **Sales & Fulfillment** to mark an order shipped or delivered, and buyers can see the seller and latest status updater in their order tracking.

When listing an item, enter its original buying price to calculate the estimated swap value. The estimate applies brand and condition adjustments to the buying price. The buying price is visible only in your own wardrobe; other members see the estimated swap value. Older listings without a recorded buying price retain their category-based estimates. Estimates are a comparison aid, not a guaranteed resale value.
