# Marketplace API

The Express API uses MongoDB/Mongoose, JWT authentication, and Cloudinary for clothing photos. Start it from `backend` with `npm run server` (development) or `npm start`.

## Configuration

Configure `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env`. The existing payment routes also use Stripe or Razorpay credentials.

## Exchange endpoints

Protected member routes use the `token` request header returned from `/api/user/login` or `/api/user/register`. Public listing browsing and value estimates do not require a token.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/user/register`, `POST /api/user/login` | Create an account or sign in |
| `GET /api/user/profile`, `PUT /api/user/profile` | View and update profile/location |
| `GET /api/listings/` | Browse available clothing; supports category, size, condition, and city filters |
| `GET /api/listings/nearby?nearby=true&maxDistance=50` | Filter listings to a radius in kilometres around the member's saved coordinates |
| `GET /api/listings/mine`, `POST /api/listings/` | Manage personal listings and upload images |
| `PUT /api/listings/:id`, `DELETE /api/listings/:id` | Edit or remove an available personal listing |
| `POST /api/listings/estimate` | Estimate a value from category, brand, and condition |
| `GET /api/swaps`, `POST /api/swaps` | View swap history or request an exchange |
| `PATCH /api/swaps/:id/respond`, `PATCH /api/swaps/:id/confirm` | Accept/reject a request or confirm completion |
| `GET/POST /api/swaps/:id/messages` | Read or send negotiation messages |
| `POST /api/swaps/:id/dispute` | Escalate an accepted exchange for review |

Admin routes are under `/api/admin` and require a token from `POST /api/user/admin`. They provide analytics, member management, listing moderation, swap monitoring, and dispute resolution. Nearby matching returns rounded distances; raw profile coordinates are not included in public listing responses.

The public `/api/product/list` and `/api/product/single` endpoints continue to support the existing storefront catalog. Cart, checkout, payment verification, and member order-history routes remain available. Admin order listing/status updates and legacy store-product deletion endpoints have been removed with their admin screens.
