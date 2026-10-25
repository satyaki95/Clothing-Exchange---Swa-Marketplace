import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";
import userModel from "../models/user.model.js";
import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "node:crypto";

// gateway initialized
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getRazorpayCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.REZORPAY_KEY_ID;
  const keySecret =
    process.env.RAZORPAY_KEY_SECRET || process.env.REZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return { keyId, keySecret };
};

const getRazorpayInstance = () => {
  const { keyId, keySecret } = getRazorpayCredentials();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

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
        return res.status(400).json({
          success: false,
          message: "One or more cart items are invalid.",
        });
      }

      const unitAmount = Math.round(product.price * 100);
      if (!Number.isSafeInteger(unitAmount) || unitAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "A cart item has an invalid price.",
        });
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
      throw new Error(
        "Stripe checkout session did not include a redirect URL.",
      );
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

// Verifying Stripe Payment
const verifyStripePayment = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Stripe checkout session is required.",
      });
    }

    const order = await orderModel.findOne({
      userId,
      stripeSessionId: sessionId,
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this checkout.",
      });
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
    const { userId, items, address } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !address) {
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
    let totalAmountPaise = 1000;

    for (const item of items) {
      const product = productsById.get(item.productId);
      if (
        !product ||
        !product.sizes.includes(item.size) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more cart items are invalid.",
        });
      }

      const unitAmountPaise = Math.round(product.price * 100);
      if (!Number.isSafeInteger(unitAmountPaise) || unitAmountPaise <= 0) {
        return res.status(400).json({
          success: false,
          message: "A cart item has an invalid price.",
        });
      }

      totalAmountPaise += unitAmountPaise * item.quantity;
      if (!Number.isSafeInteger(totalAmountPaise)) {
        return res.status(400).json({
          success: false,
          message: "The order total is invalid.",
        });
      }
    }

    const razorpayInstance = getRazorpayInstance();
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: totalAmountPaise,
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    const orderData = {
      userId,
      items,
      totalAmount: totalAmountPaise / 100,
      paymentMethod: "razorpay",
      payment: false,
      shippingAddress: address,
      razorpayOrderId: razorpayOrder.id,
    };
    const newOrder = new orderModel(orderData);
    await newOrder.save();

    return res.status(201).json({
      success: true,
      message: "Razorpay checkout order created successfully.",
      order: newOrder,
      keyId: getRazorpayCredentials().keyId,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message === "Razorpay credentials are not configured."
          ? error.message
          : "Unable to start Razorpay checkout.",
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      typeof razorpay_signature !== "string" ||
      !/^[a-f\d]{64}$/i.test(razorpay_signature)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Razorpay payment details are invalid." });
    }

    const order = await orderModel.findOne({
      userId,
      razorpayOrderId: razorpay_order_id,
      paymentMethod: "razorpay",
    });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Razorpay order not found." });
    }

    const razorpayInstance = getRazorpayInstance();
    const { keySecret } = getRazorpayCredentials();
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();
    const receivedSignature = Buffer.from(razorpay_signature, "hex");

    if (!crypto.timingSafeEqual(expectedSignature, receivedSignature)) {
      return res
        .status(400)
        .json({ success: false, message: "Razorpay payment signature is invalid." });
    }

    const [razorpayOrder, payment] = await Promise.all([
      razorpayInstance.orders.fetch(razorpay_order_id),
      razorpayInstance.payments.fetch(razorpay_payment_id),
    ]);
    const expectedAmount = Math.round(order.totalAmount * 100);
    if (
      razorpayOrder.amount !== expectedAmount ||
      razorpayOrder.currency !== "INR" ||
      payment.order_id !== razorpay_order_id ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR"
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Razorpay payment does not match the order." });
    }

    let verifiedPayment = payment;
    if (verifiedPayment.status === "authorized") {
      verifiedPayment = await razorpayInstance.payments.capture(
        razorpay_payment_id,
        expectedAmount,
        "INR",
      );
    }

    if (verifiedPayment.status !== "captured") {
      return res
        .status(400)
        .json({ success: false, message: "Razorpay payment has not been captured." });
    }

    if (!order.payment) {
      order.payment = true;
      order.razorpayPaymentId = razorpay_payment_id;
      await order.save();
    }
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    return res.status(200).json({
      success: true,
      message: "Razorpay payment verified successfully.",
    });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify Razorpay payment.",
    });
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

export {
  placeOrderCod,
  placeOrderStripe,
  verifyStripePayment,
  placeOrderRazorpay,
  verifyRazorpayPayment,
  getUserOrders,
};
