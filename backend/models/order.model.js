import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
        name: { type: String, default: "" },
        unitPrice: { type: Number, min: 0 },
        size: {
          type: String,
          default: "",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      type: Object,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "razorpay", "cod"],
      required: true,
    },
    payment: {
      type: Boolean,
      default: false,
      required: true,
    },
    stripeSessionId: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    source: {
      type: String,
      enum: ["cart", "listing"],
      default: "cart",
    },
  },
  { timestamps: true },
);

const orderModel = mongoose.model("Order", orderSchema);

export default orderModel;
