import express from "express";
import {
  placeOrderCod,
  placeOrderStripe,
  verifyStripePayment,
  placeOrderRazorpay,
  verifyRazorpayPayment,
  getUserOrders,
  getSellerOrders,
  updateSellerOrderStatus,
  placeListingOrderCod,
  placeListingOrderStripe,
  placeListingOrderRazorpay,
  cancelListingOrder,
} from "../controllers/order.controller.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

// Placing orders using COD Method
orderRouter.post("/place", authUser, placeOrderCod);

// Placing orders using Stripe Method
orderRouter.post("/stripe", authUser, placeOrderStripe);
orderRouter.post("/stripe/verify", authUser, verifyStripePayment);

// Placing orders using Razorpay Method
orderRouter.post("/razorpay", authUser, placeOrderRazorpay);
orderRouter.post("/razorpay/verify", authUser, verifyRazorpayPayment);

// Get user orders (Frontend)
orderRouter.post("/user-orders", authUser, getUserOrders);
orderRouter.get("/seller-orders", authUser, getSellerOrders);
orderRouter.patch("/seller-orders/:orderId/status", authUser, updateSellerOrderStatus);
orderRouter.post("/listing/place", authUser, placeListingOrderCod);
orderRouter.post("/listing/stripe", authUser, placeListingOrderStripe);
orderRouter.post("/listing/razorpay", authUser, placeListingOrderRazorpay);
orderRouter.post("/listing/:orderId/cancel", authUser, cancelListingOrder);

export default orderRouter;
