import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";
import userModel from "../models/user.model.js";
import Stripe from "stripe";

// gateway initialized
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Placing orders using COD Method
const placeOrderCod = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const orderData = {
      userId,
      items,
      totalAmount: amount,
      paymentMethod: "cod",
      payment: false,
      shippingAddress: address,
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error placing COD order:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Placing orders using Stripe Method
const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, address } = req.body;
    const origin = req.get("origin");
    if (!Array.isArray(items) || items.length === 0 || !address || !origin) {
      return res
        .status(400)
        .json({ success: false, message: "Order details are incomplete." });
    }

    const products = await productModel.find({
      _id: { $in: items.map((item) => item.productId) },
    });
    const productsById = new Map(
      products.map((product) => [product._id.toString(), product]),
    );
    const lineItems = [];
    let totalAmountPaise = 1000;

    for (const item of items) {
      const product = productsById.get(item.productId);
      if (
        !product ||
        !product.sizes.includes(item.size) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res
          .status(400)
          .json({ success: false, message: "One or more cart items are invalid." });
      }

      const unitAmount = Math.round(product.price * 100);
      if (!Number.isSafeInteger(unitAmount) || unitAmount <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "A cart item has an invalid price." });
      }

      totalAmountPaise += unitAmount * item.quantity;
      lineItems.push({
        price_data: {
          currency: "inr",
          product_data: { name: product.name },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      });
    }

    lineItems.push({
      price_data: {
        currency: "inr",
        product_data: { name: "Delivery fee" },
        unit_amount: 1000,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/place-order?canceled=true`,
    });

    if (!session.url) {
      throw new Error("Stripe checkout session did not include a redirect URL.");
    }

    const newOrder = new orderModel({
      userId,
      items,
      totalAmount: totalAmountPaise / 100,
      paymentMethod: "stripe",
      payment: false,
      shippingAddress: address,
      stripeSessionId: session.id,
    });
    await newOrder.save();

    return res.status(201).json({
      success: true,
      message: "Stripe checkout session created successfully",
      order: newOrder,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to start Stripe checkout." });
  }
};

const verifyStripePayment = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    if (!sessionId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Stripe checkout session is required.",
        });
    }

    const order = await orderModel.findOne({
      userId,
      stripeSessionId: sessionId,
    });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found for this checkout." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Stripe payment has not completed." });
    }

    if (!order.payment) {
      order.payment = true;
      await order.save();
    }
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    return res.status(200).json({
      success: true,
      message: "Stripe payment verified successfully.",
    });
  } catch (error) {
    console.error("Error verifying Stripe payment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to verify Stripe payment." });
  }
};

// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req, res) => {
  try {
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// All Orders data for admin Panel
const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate("userId")
      .populate("items.productId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All orders fetched successfully",
      orders,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// User Order Data for Frontend
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.body;

    const orders = await orderModel
      .find({ userId })
      .populate("items.productId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "User orders fetched successfully",
      orders,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { returnDocument: "after" },
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export {
  placeOrderCod,
  placeOrderStripe,
  verifyStripePayment,
  placeOrderRazorpay,
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
};
