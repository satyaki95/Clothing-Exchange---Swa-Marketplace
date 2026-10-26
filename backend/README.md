# Marketplace API

The Express API uses MongoDB/Mongoose, JWT authentication, and Cloudinary for clothing photos. Start it from `backend` with `npm run server` (development) or `npm start`.

## Configuration

Configure `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env`. Razorpay checkout requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from the same Razorpay account; use matching test keys while developing and restart the backend after changing `.env`. Stripe checkout uses `STRIPE_SECRET_KEY`.

## Exchange endpoints

Protected member routes use the `token` request header returned from `/api/user/login` or `/api/user/register`. Public listing browsing and value estimates do not require a token.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/user/register`, `POST /api/user/login` | Create an account or sign in |
| `GET /api/user/profile`, `PUT /api/user/profile` | View and update profile/location |
| `GET /api/listings/` | Browse available clothing; supports category, size, condition, and city filters |
| `GET /api/listings/:id` | View an available community listing's details |
| `GET /api/listings/nearby?nearby=true&maxDistance=50` | Filter listings to a radius in kilometres around the member's saved coordinates |
| `GET /api/listings/mine`, `POST /api/listings/` | Manage personal listings and upload images |
| `PUT /api/listings/:id`, `DELETE /api/listings/:id` | Edit or remove an available personal listing |
| `POST /api/listings/estimate` | Estimate a swap value from buying price, brand, and condition; category remains the fallback when no buying price is supplied |
| `GET /api/swaps`, `POST /api/swaps` | View swap history or request an exchange |
| `PATCH /api/swaps/:id/respond`, `PATCH /api/swaps/:id/confirm` | Accept/reject a request or confirm completion |
| `GET/POST /api/swaps/:id/messages` | Read or send negotiation messages |
| `POST /api/swaps/:id/dispute` | Escalate an accepted exchange for review |
| `POST /api/order/listing/place` | Buy a community listing with cash on delivery |
| `POST /api/order/listing/stripe`, `POST /api/order/listing/razorpay` | Buy a community listing with an online payment provider |
| `GET /api/order/seller-orders` | View active paid/COD orders for the signed-in member's listings |
| `PATCH /api/order/seller-orders/:orderId/status` | Listing owner advances fulfillment from processing to shipped to delivered |

Admin routes are under `/api/admin` and require a token from `POST /api/user/admin`. They provide analytics, member management, listing moderation, swap monitoring, and dispute resolution. Nearby matching returns rounded distances; raw profile coordinates are not included in public listing responses.

Buyer order history includes the listing owner and the seller who last updated its shipping status. Listing owners can update eligible orders in Sales & Fulfillment; each status change is recorded on the order. The public `/api/product/list` and `/api/product/single` endpoints continue to support the existing storefront catalog. Cart, checkout, payment verification, and member order-history routes remain available. Admin order listing/status updates and legacy store-product deletion endpoints have been removed with their admin screens.

Community listing purchases use the estimated swap value as the item price plus the existing ₹10 delivery charge. A member's buying price is returned only in their own wardrobe; public listings expose the estimated swap value, not the buying price. New listings require a non-negative buying price, and their swap estimate applies the existing brand and condition multipliers to that price. Older listings without a buying price retain category-based estimates. Online checkouts reserve the listing for up to 35 minutes; COD orders mark the listing sold when placed.
