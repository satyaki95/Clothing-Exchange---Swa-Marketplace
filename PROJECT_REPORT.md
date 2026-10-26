# Swa Marketplace — Project Report

**Prepared:** October 26, 2026  
**Project:** Clothing Exchange / Swa Marketplace  
**Repository:** satyaki95/Clothing-Exchange---Swa-Marketplace

## 1. Executive Summary

Swa Marketplace is a clothing resale and peer-to-peer exchange platform that combines traditional e-commerce with community-driven fashion trading. The application supports browsing catalog products, listing personal clothing items for sale, discovering nearby listings, request swaps, messaging fellow members, and placing orders for both new and community listings.

The repository includes three major runtime components:

1. frontend/: customer storefront built with React and Vite
2. admin/: administrator dashboard built with React and Vite
3. backend/: Express API connected to MongoDB, Cloudinary, Stripe, and Razorpay

The project is designed for a marketplace with three core roles:

- Member/customer: browse products, add to cart, create listings, manage wardrobe, find nearby items, and place orders
- Seller/owner: publish listings, manage inventory, fulfill orders, and respond to swap activity
- Administrator: monitor platform health, manage users, review listings, and oversee swaps/disputes

The codebase is structurally well organized and includes modular routes, controllers, models, middleware, and separate frontends. The core product flow is present and functional, making it a solid full-stack project foundation.

## 2. Project Objectives

The primary goal of Swa Marketplace is to create a frictionless clothing exchange ecosystem where users can:

- purchase catalog items using a conventional storefront and cart flow
- sell or exchange private wardrobe items in a community marketplace
- discover listings by category, size, condition, city, and distance
- propose swaps and negotiate with other members
- track order and seller fulfillment activity
- manage profile and location data
- allow administrators to moderate disputes, listings, and users

The platform blends an online shopping model with a local clothing marketplace model, giving it both e-commerce and peer-to-peer commerce behavior.

## 3. Repository Layout

| Area | Purpose | Main location |
| --- | --- | --- |
| Storefront | Customer-facing shopping and listing UI | frontend/ |
| Admin | Platform moderation and dashboard UI | admin/ |
| API | Business logic, persistence, orders, payments | backend/ |
| Data models | MongoDB entities and schema definitions | backend/models/ |
| Routes | HTTP API route definitions | backend/routes/ |
| Controllers | Request handling and logic | backend/controllers/ |
| Middleware | Auth, uploads, optional auth | backend/middleware/ |
| Config | DB and Cloudinary connections | backend/config/ |

## 4. Technology Stack

### Frontend and Admin UI

- React 19
- Vite
- React Router DOM
- Tailwind CSS
- Axios
- React Toastify
- ESLint

### Backend

- Node.js
- Express 5
- MongoDB via Mongoose
- JWT-based authentication
- bcrypt password hashing
- Multer upload handling
- Cloudinary image storage
- Stripe Checkout integration
- Razorpay integration

### Runtime configuration

- Separate frontend and admin apps run independently
- Local defaults are configured as:
  - Storefront: http://localhost:5173
  - Admin: http://localhost:5174
  - Backend: http://localhost:4000

## 5. Functional Scope

### 5.1 Storefront capabilities

The storefront provides a complete buyer and seller experience:

- browse products in a catalog-driven shopping flow
- view product pages and related product suggestions
- add products to cart and manage quantities
- checkout with COD, Stripe, or Razorpay
- inspect order history and current order status
- create wardrobe listings with images and metadata
- browse available community listings by city/category/size/condition
- use nearby-search filters with location-aware radius checks
- request swaps between listings
- message swap participants and resolve disputes
- manage profile details including city/state and coordinates

### 5.2 Admin capabilities

The admin app is a dedicated moderation dashboard with views for:

- summary/statistical overview
- member management
- listing moderation
- swap monitoring and dispute resolution
- user suspension/restoration
- content approval and removal workflows

The admin application is structured with a login screen, navbar, sidebar, and a single management page controlling different sections.

### 5.3 Backend capabilities

The backend is the operational core for the marketplace and exposes APIs for:

- user registration and login
- admin login
- profile read/update
- catalog product listing
- cart creation and updates
- order placement and verification
- community listing creation and management
- nearby listing discovery
- swap creation and negotiation
- message exchange between swap participants
- admin moderation and metrics

## 6. Application Architecture

### Frontend architecture

The storefront is a React single-page app with route-based screens. The main route definitions in frontend/src/App.jsx include:

| Route | Purpose |
| --- | --- |
| / | Home page |
| /collection, /shop, /store | Product and listing discovery |
| /product/:productId | Product detail view |
| /cart | Cart and checkout entry |
| /login | Login page |
| /place-order | Checkout |
| /orders | User order history |
| /seller-orders | Seller fulfillment view |
| /marketplace | Community listing marketplace |
| /listing/:listingId | Listing detail page |
| /listing/:listingId/checkout | Listing purchase checkout |
| /wardrobe | User listing inventory |
| /profile | User profile |
| /swaps | Swap management |
| /about | About page |
| /contact | Contact page |

The frontend/src/context/ShopContext.jsx is the main state container for storefront auth, cart processing, listing interactions, and shared API access.

### Admin app architecture

The admin app is a separate React project. It stores the admin token in localStorage and routes to dashboard sections such as:

- /dashboard
- /users
- /listings
- /swaps

The app conditionally renders a login form if no admin token is present; otherwise it displays the main admin navigation and management screen.

### Backend architecture

The API entry point is backend/server.js. It configures:

- Express app
- JSON parsing
- CORS
- MongoDB connection
- Cloudinary configuration
- route mounting for major modules

The root API mounts these route groups:

| Prefix | Representative endpoints | Purpose |
| --- | --- | --- |
| /api/user | /register, /login, /admin, /profile | member registration, auth, profile |
| /api/product | /list, /single/:id | catalog products |
| /api/cart | /get, /add, /update, /listing/* | cart management |
| /api/order | /place, /stripe, /razorpay, /user-orders | checkout and payment flow |
| /api/listings | /, /mine, /nearby, /:id | listing discovery and management |
| /api/swaps | /, /:id/respond, /:id/messages | swap lifecycle and chat |
| /api/admin | /summary, /users, /listings, /swaps | admin workflows and moderation |

## 7. Route and API Summary

### User routes

backend/routes/user.route.js exposes:

- POST /api/user/register
- POST /api/user/login
- POST /api/user/admin
- GET /api/user/profile
- PUT /api/user/profile

### Listing routes

backend/routes/listing.route.js exposes:

- POST /api/listings/estimate
- GET /api/listings/
- GET /api/listings/nearby
- GET /api/listings/mine
- GET /api/listings/:id
- POST /api/listings/
- PUT /api/listings/:id
- DELETE /api/listings/:id

### Order routes

backend/routes/order.route.js exposes:

- POST /api/order/place (COD)
- POST /api/order/stripe
- POST /api/order/stripe/verify
- POST /api/order/razorpay
- POST /api/order/razorpay/verify
- POST /api/order/user-orders
- GET /api/order/seller-orders
- PATCH /api/order/seller-orders/:orderId/status
- POST /api/order/listing/place
- POST /api/order/listing/stripe
- POST /api/order/listing/razorpay
- POST /api/order/listing/:orderId/cancel

### Swap routes

backend/routes/swap.route.js exposes:

- GET /api/swaps/
- POST /api/swaps/
- PATCH /api/swaps/:id/respond
- PATCH /api/swaps/:id/confirm
- POST /api/swaps/:id/dispute
- GET /api/swaps/:id/messages
- POST /api/swaps/:id/messages

## 8. Main Data Models

The platform uses MongoDB models around several core entities.

### User

The User model stores:

- account credentials and profile data
- suspended/active state
- member type and role information
- location fields such as city/state and coordinate data
- cart state and listing-related references

### Product

Used for the catalog shopping flow, including product images, pricing, category metadata, and inventory configuration.

### Listing

The Listing model represents member-owned clothing items and includes:

- images and media URLs
- title, description, category, size, and condition
- buying price and estimated value
- owner reference
- listing status and reservation metadata

### Swap

The Swap model supports a peer-to-peer fashion exchange and includes:

- offering user and requested user
- offered and requested listings
- confirmation and status state
- dispute resolution metadata

### Order

The Order model supports both standard-product purchases and community-listing transactions, with:

- source (catalog or listing)
- buyer and seller references
- payment method and gateway details
- delivery address information
- order status and fulfillment state

## 9. Business Workflows

### Catalog shopping workflow

1. A user browses products in the storefront.
2. Products are added to the cart with selected variants and quantities.
3. The cart is checked out using COD, Stripe, or Razorpay.
4. Order verification completes once the payment or COD confirmation is accepted.
5. The user sees the purchase in their order history.

### Community marketplace workflow

1. A member creates a listing with up to five images.
2. The listing is stored with pricing and item metadata.
3. Other users browse the listing marketplace and apply filters.
4. A user may request a swap or buy a listing directly.
5. The seller can fulfill or reject the order or swap action.

### Swap lifecycle

1. A user chooses an item they own and an item they want.
2. A swap offer is created.
3. The counterpart can respond or negotiate through messages.
4. The swap can be confirmed or escalated to a dispute.
5. Admin can review and resolve disputes.

## 10. Local Setup

### Prerequisites

- Node.js and npm
- MongoDB instance accessible from the backend
- Cloudinary account and keys
- Stripe credentials
- Razorpay credentials

### Backend

```bash
cd backend
npm install
npm run server
```

The backend server boots from server.js and listens on PORT or defaults to 4000.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Admin

```bash
cd admin
npm install
npm run dev
```

### Build checks

```bash
cd frontend
npm run build
npm run lint
```

```bash
cd admin
npm run build
npm run lint
```

## 11. Environment Configuration

The app expects these environment settings:

| Variable | Use |
| --- | --- |
| PORT | Backend listening port |
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Token signing/verification |
| CLOUDINARY_CLOUD_NAME | image storage account |
| CLOUDINARY_API_KEY | Cloudinary API auth |
| CLOUDINARY_API_SECRET | Cloudinary secret |
| STRIPE_SECRET_KEY | Stripe payment verification |
| RAZORPAY_KEY_ID | Razorpay client credential |
| RAZORPAY_KEY_SECRET | Razorpay secret |
| VITE_BACKEND_URL | Frontend/admin API base URL |
| VITE_STORE_URL | Admin redirect to storefront |

Important: do not commit real secrets to version control. Production deployments should use environment-specific secret stores.

## 12. Deployment Notes

The project is built as a multi-app architecture with separate frontend, admin, and backend services. This is suitable for deployment on a host platform such as Vercel, Render, Railway, or a custom Node environment.

Operational deployment concerns include:

- CORS restrictions for approved origins
- secure environment variable management
- Cloudinary upload validation and quotas
- payment verification for Stripe and Razorpay
- MongoDB connectivity and startup health checks
- proper routing for deep links in the frontend/admin apps

## 13. Current Strengths

- Clear separation between storefront, admin, and backend
- Feature-rich marketplace flow spanning shopping, listing, swap, and moderation
- Modular structure makes business logic easy to extend
- Payment integrations are present for both online and offline checkout paths
- Multiple user roles are represented in both the API and UI

## 14. Recommended Improvements

Before production launch, the project should prioritize:

1. strong authorization checks on listing and order ownership
2. validation for uploads and file types
3. consistent role enforcement for public/admin-only actions
4. secure handling of secrets and environment values
5. anti-abuse controls on authentication and payment endpoints
6. test coverage for flows such as checkout, swaps, and admin moderation
7. consistent cleanup for deleted listings, orders, and user references
8. rate limiting and request-size controls

## 15. Conclusion

Swa Marketplace is a substantial full-stack clothing exchange project with a realistic business model and a clear technical architecture. It combines catalog commerce, community listings, swaps, order processing, and admin moderation in a way that is coherent and extendable.

The current repository demonstrates a strong base implementation and a practical product direction. With production-focused hardening around auth, payment safety, file validation, and deployment configuration, it can evolve into a reliable marketplace platform for buying, selling, and swapping clothing.
