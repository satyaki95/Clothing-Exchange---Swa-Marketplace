# Swa Marketplace — Project Report

**Prepared:** October 26, 2026  
**Project:** Clothing Exchange / Swa Marketplace  
**Repository:** `satyaki95/Clothing-Exchange---Swa-Marketplace`

## 1. Executive summary

Swa Marketplace is a clothing resale and peer-to-peer exchange application. It consists of three separately run applications:

1. A React storefront for browsing catalog products and community clothing listings.
2. A React admin panel for marketplace oversight and moderation.
3. An Express API backed by MongoDB/Mongoose, with Cloudinary image storage and Stripe/Razorpay payment integrations.

Members can manage profiles and listings, discover clothing by category, size, condition, city, or distance, request swaps, message swap participants, and buy community listings. The storefront also retains a conventional product-cart/order flow. Administrators can review marketplace metrics, suspend members, remove listings, and resolve swap disputes.

## 2. Technology and repository layout

| Area | Implementation | Main location |
| --- | --- | --- |
| Storefront | React 19, Vite, React Router, Tailwind CSS, Axios | `frontend/` |
| Admin UI | React 19, Vite, React Router, Tailwind CSS, Axios | `admin/` |
| API | Node.js ES modules, Express 5 | `backend/` |
| Database | MongoDB via Mongoose | `backend/config/mongodb.js`, `backend/models/` |
| Authentication | JWT; bcrypt-hashed member passwords | `backend/middleware/`, `backend/controllers/user.controller.js` |
| Product/listing images | Cloudinary; Multer handles listing uploads | `backend/config/cloudinary.js`, `backend/middleware/multer.js` |
| Online payments | Stripe Checkout and Razorpay Orders/Payments | `backend/controllers/order.controller.js` |

Key source areas:

- `frontend/src/pages/` contains member-facing screens.
- `frontend/src/components/` contains shared storefront UI.
- `frontend/src/context/ShopContext.jsx` manages storefront authentication, product/cart state, and API access.
- `admin/src/pages/Management.jsx` renders the admin dashboard and management views.
- `backend/routes/` maps HTTP endpoints to controllers.
- `backend/controllers/` implements application workflows.
- `backend/models/` defines MongoDB document schemas.

## 3. Applications and user-facing capabilities

### Storefront

The storefront has two related shopping/discovery experiences:

- **Catalog shopping:** Existing products can be browsed, added to a cart with a size and quantity, checked out, and viewed in order history.
- **Community marketplace:** Members publish clothing listings, browse other members’ available listings, filter by city/category/size/condition, and optionally find listings within a distance radius using saved coordinates.
- **Swaps:** A member proposes one of their listings in exchange for another listing. Participants can respond, exchange messages, confirm completion, or report a dispute.
- **Direct listing purchase:** A community listing can be bought with cash on delivery, Stripe, or Razorpay. Online purchases reserve the listing temporarily while payment is pending.
- **Member profile:** Name, city, state, postal code, and optional latitude/longitude are managed through the profile.
- **Listing valuation:** A value estimate uses the supplied buying price when available, adjusted for brand and condition. Older listings without a buying price can use category-based base values.
- **Order fulfillment:** Buyers view their orders and listing-purchase tracking. Listing owners can progress eligible orders through shipped and delivered.

The primary customer-facing routes are declared in `frontend/src/App.jsx`, including `/collection`, `/marketplace`, `/store`, `/cart`, `/orders`, `/seller-orders`, `/profile`, `/wardrobe`, `/swaps`, and listing detail/checkout routes.

### Admin panel

The admin UI has a dashboard, member management, listing moderation, and swap/dispute management:

- Dashboard counters include members, listings, available listings, swaps, completed swaps, and open disputes.
- Members can be suspended or restored.
- Marketplace listings can be removed from public availability.
- Active swap activity and disputes can be reviewed; a dispute resolution requires an outcome and a note.

Admin routes are declared in `admin/src/App.jsx`. The UI currently has pages for `/dashboard`, `/users`, `/listings`, and `/swaps`; the sidebar is in `admin/src/components/Sidebar.jsx`.

### App-to-app navigation

The storefront and admin panel are independent web apps. The storefront includes an Admin link; the admin app includes links back to the storefront from its header and login screen. The links clear the current app’s saved token before switching. Local defaults are `http://localhost:5173` for the storefront and `http://localhost:5174` for admin; deployments can override these using Vite environment variables.

## 4. Backend architecture and API

The API entry point is `backend/server.js`. It initializes the database and Cloudinary configuration, enables JSON request parsing and CORS, mounts route modules, and listens on `PORT` (default `4000`).

### Route groups

| Prefix | Representative endpoints | Purpose |
| --- | --- | --- |
| `/api/user` | `POST /register`, `POST /login`, `POST /admin`, `GET/PUT /profile` | Member registration/login, admin login, profile |
| `/api/product` | `GET /list`, `GET /single/:id` | Existing catalog products |
| `/api/cart` | `POST /get`, `POST /add`, `PUT /update`, `/listing/*` | Product and listing cart operations |
| `/api/order` | `/place`, `/stripe`, `/razorpay`, `/user-orders`, `/seller-orders`, `/listing/*` | Checkout, payment verification, order history, fulfillment |
| `/api/listings` | `GET /`, `/nearby`, `/mine`; `POST /`, `PUT/DELETE /:id`; `POST /estimate` | Listing discovery, authoring, management, and estimates |
| `/api/swaps` | `GET/POST /`, `PATCH /:id/respond`, `/confirm`, `POST /:id/dispute`, `GET/POST /:id/messages` | Swap lifecycle, negotiation, and disputes |
| `/api/admin` | `/summary`, `/users`, `/listings`, `/swaps` and moderation mutations | Admin-only reporting and moderation |

Member-protected endpoints use the `token` request header and `authUser` middleware. Admin endpoints use `adminAuth`, which requires a JWT with the admin claim. The admin login endpoint issues that claim after comparing credentials with the configured admin environment variables.

### Main data entities

| Model | Purpose and relationships |
| --- | --- |
| `User` | Member credentials/profile, suspension flag, product cart, listing cart, and optional geographic coordinates |
| `Product` | Existing catalog product used by the traditional shopping cart |
| `Listing` | Member-owned clothing listing with images, category, size, condition, optional buying price, estimated value, status, and reservation references |
| `Swap` | Proposed exchange between two users and two listings; includes lifecycle status, confirmations, and dispute resolution data |
| `Message` | Negotiation messages associated with swaps and their participants |
| `Order` | Catalog-cart or community-listing purchase, delivery address, payment method/status, order status, and gateway references |

Listings are associated with owners and can be available, reserved, swapped, sold, or removed. Swap records reference offering/requesting users and listings. Orders can reference either catalog products or community listings and identify their origin with the `source` field.

## 5. Key business workflows

### Listing publication and discovery

1. A signed-in member creates a listing and uploads up to five images.
2. The backend computes or accepts the listing valuation using the project’s valuation utility.
3. Public browsing returns available listings and owner display details. Buying price is intended for the owner’s own wardrobe view rather than the public listing response.
4. City filtering is case-insensitive and matches a partial city string. Nearby filtering calculates distances from member coordinates and returns rounded distances.

### Swap lifecycle

1. An authenticated member submits an offered listing and a requested listing.
2. Participants respond and can message each other while the exchange is active.
3. The exchange can be confirmed by participants or escalated to a dispute.
4. An administrator resolves a dispute as completed or cancelled and the related listing statuses are updated.

### Purchase and payment

- Traditional cart orders support COD, Stripe, and Razorpay.
- Community listing checkout supports the same methods and adds the configured ₹10 delivery fee to the estimated listing value.
- Stripe returns a Checkout Session ID to the storefront, which calls the API to verify the session before marking the order paid.
- Razorpay verification checks the payment signature and compares gateway order/payment amounts and currency before marking the order paid.
- Cart clearing is intended to happen only after COD order placement or successful online payment verification. The user order-history query includes COD orders and successfully paid online orders, not unpaid payment attempts.
- Community listing online checkout reserves the listing for up to 35 minutes. Expired reservations are released by listing/order workflow logic.

## 6. Local setup

### Prerequisites

- A supported Node.js runtime and npm.
- MongoDB reachable using the configured URI.
- Cloudinary credentials for listing image uploads.
- Stripe and/or Razorpay credentials for the corresponding online checkout method.

### Environment configuration

Create the required environment files locally; do not commit credentials.

**`backend/.env`**

| Variable | Use |
| --- | --- |
| `PORT` | API port; defaults to `4000` |
| `MONGODB_URI` | MongoDB connection URI; the connection module appends `/e-commerce` |
| `JWT_SECRET` | Signs and verifies member/admin tokens |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin login credentials |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image storage configuration |
| `STRIPE_SECRET_KEY` | Stripe Checkout and verification |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay API and payment verification |

Razorpay key ID and secret must come from the same Razorpay account. Use gateway test credentials during development.

**`frontend/.env`**

- `VITE_BACKEND_URL`: API base URL.
- `VITE_ADMIN_URL`: Optional admin app URL; defaults to `http://localhost:5174`.

**`admin/.env`**

- `VITE_BACKEND_URL`: API base URL.
- `VITE_STORE_URL`: Optional storefront URL; defaults to `http://localhost:5173`.

### Run the services

Open a terminal in each directory and run:

```powershell
# backend
npm run server

# storefront
npm run dev

# admin
npm run dev
```

The Vite configurations set the storefront to port `5173` and admin to port `5174`. The backend uses port `4000` unless overridden.

### Build and lint

From `frontend` or `admin`:

```powershell
npm run build
npm run lint
```

The backend package currently exposes `npm start` and `npm run server`; no dedicated backend test or lint script is declared in its package manifest.

## 7. Operational and implementation notes

- The storefront, admin app, and API are separate processes and should be configured with the correct URLs for each environment.
- The API currently enables CORS without an explicit origin allowlist. Production deployments should configure allowed origins deliberately.
- Tokens are stored in browser `localStorage` by the client apps and sent in a request header. Admin and storefront run on different origins when using the local port defaults, so their browser storage is separate.
- Admin account credentials are checked against environment variables. Keep those values strong and private, and protect deployment secrets.
- Payment integrations require valid provider settings and network access. A missing or invalid gateway configuration prevents the related checkout from starting.
- The database connection explicitly selects the `e-commerce` database by appending that name to `MONGODB_URI`.
- No automated test files were found in the application source directories during this report’s review. The frontend/admin package manifests provide build and lint scripts; the backend manifest does not define a test script.

## 8. Report scope

This report describes the repository implementation and setup as inspected on October 26, 2026. It is a codebase overview, not a production-readiness certification, security audit, or verification of live payment, database, or Cloudinary credentials.
