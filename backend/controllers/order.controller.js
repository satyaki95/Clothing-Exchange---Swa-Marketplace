import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";
import userModel from "../models/user.model.js";
import listingModel from "../models/listing.model.js";
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

const getRazorpayCheckoutErrorMessage = (error) => {
  if (error.message === "Razorpay credentials are not configured.") {
    return "Razorpay credentials are missing. Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then restart the backend.";
  }
  const description =
    error.error?.description || error.response?.data?.error?.description;
  const code = error.error?.code || error.response?.data?.error?.code;
  if (typeof description === "string" && description.trim()) {
    return `Razorpay could not create the order${code ? ` (${code})` : ""}: ${description}`;
  }
  if (error.statusCode === 401) {
    return "Razorpay rejected the configured API key pair. Verify that the Key ID and Key Secret match and were generated in the same Razorpay account.";
  }
  if (error.statusCode === 400) {
    return "Razorpay rejected the order request. Check the Razorpay account setup and backend logs for details.";
  }
  return "Unable to start Razorpay checkout. Check the backend logs and Razorpay API connectivity.";
};

const logRazorpayCheckoutError = (context, error) => {
  console.error(context, {
    statusCode: error.statusCode || error.response?.status,
    code: error.error?.code || error.response?.data?.error?.code,
    description:
      error.error?.description || error.response?.data?.error?.description,
    message: error.message,
  });
};

const LISTING_RESERVATION_MINUTES = 35;
const LISTING_DELIVERY_FEE = 10;

const validateListingCheckout = async (userId, listingId, address) => {
  const expiredListings = await listingModel
    .find({
      status: "reserved",
      purchaseOrder: { $ne: null },
      reservationExpiresAt: { $lte: new Date() },
    })
    .select("_id purchaseOrder");
  if (expiredListings.length > 0) {
    const orderIds = expiredListings.map((listing) => listing.purchaseOrder);
    await orderModel.updateMany(
      { _id: { $in: orderIds }, status: "pending", payment: false },
      { $set: { status: "cancelled" } },
    );
    await listingModel.updateMany(
      { _id: { $in: expiredListings.map((listing) => listing._id) }, status: "reserved" },
      { $set: { status: "available", purchaseOrder: null, reservationExpiresAt: null } },
    );
  }
  if (!listingId || !address || typeof address !== "object") {
    return { error: "Listing and delivery address are required." };
  }
  const requiredAddressFields = [
    "firstName",
    "lastName",
    "email",
    "street",
    "city",
    "state",
    "zipcode",
    "country",
    "phone",
  ];
  if (requiredAddressFields.some((field) => !String(address[field] || "").trim())) {
    return { error: "Complete all delivery address fields." };
  }
  const listing = await listingModel.findOne({
    _id: listingId,
    status: "available",
    owner: { $ne: userId },
  });
  if (!listing) {
    return { error: "This listing is no longer available." };
  }
  const itemPrice = Number(listing.estimatedValue);
  if (!Number.isSafeInteger(itemPrice) || itemPrice <= 0) {
    return { error: "This listing has an invalid purchase price." };
  }
  return { listing, itemPrice, totalAmount: itemPrice + LISTING_DELIVERY_FEE };
};

const createListingPurchaseOrder = async ({
  userId,
  listing,
  address,
  itemPrice,
  totalAmount,
  paymentMethod,
}) =>
  orderModel.create({
    userId,
    items: [
      {
        listingId: listing._id,
        name: listing.title,
        unitPrice: itemPrice,
        size: listing.size,
        quantity: 1,
      },
    ],
    totalAmount,
    paymentMethod,
    payment: false,
    shippingAddress: address,
    source: "listing",
    status: paymentMethod === "cod" ? "processing" : "pending",
  });

const reserveListingForPayment = async (listing, order) => {
  const reservationExpiresAt = new Date(
    Date.now() + LISTING_RESERVATION_MINUTES * 60 * 1000,
  );
  const reserved = await listingModel.findOneAndUpdate(
    { _id: listing._id, status: "available" },
    {
      $set: {
        status: "reserved",
        purchaseOrder: order._id,
        reservationExpiresAt,
      },
    },
    { new: true },
  );
  return { reserved, reservationExpiresAt };
};

const releaseListingOrder = async (order) => {
  await listingModel.updateOne(
    { purchaseOrder: order._id, status: "reserved" },
    {
      $set: { status: "available", purchaseOrder: null, reservationExpiresAt: null },
    },
  );
};

const completeListingPurchase = async (order) => {
  if (!["pending", "processing"].includes(order.status)) return false;
  const sold = await listingModel.findOneAndUpdate(
    { purchaseOrder: order._id, status: "reserved" },
    { $set: { status: "sold", reservationExpiresAt: null } },
    { new: true },
  );
  if (sold) return true;
  return Boolean(
    await listingModel.findOne({
      purchaseOrder: order._id,
      status: "sold",
    }).select("_id"),
  );
};

const placeListingOrderCod = async (req, res) => {
  let order;
  try {
    const { listingId, address } = req.body;
    const checkout = await validateListingCheckout(req.userId, listingId, address);
    if (checkout.error) {
      return res.status(400).json({ success: false, message: checkout.error });
    }
    order = await createListingPurchaseOrder({
      userId: req.userId,
      listing: checkout.listing,
      address,
      itemPrice: checkout.itemPrice,
      totalAmount: checkout.totalAmount,
      paymentMethod: "cod",
    });
    const sold = await listingModel.findOneAndUpdate(
      { _id: checkout.listing._id, status: "available" },
      { $set: { status: "sold", purchaseOrder: order._id, reservationExpiresAt: null } },
      { new: true },
    );
    if (!sold) {
      await orderModel.findByIdAndDelete(order._id);
      return res.status(409).json({ success: false, message: "This listing was just purchased by someone else." });
    }
    return res.status(201).json({
      success: true,
      message: "Purchase placed successfully.",
      order,
    });
  } catch (error) {
    console.error("Failed to place listing COD order:", error);
    if (order) await orderModel.findByIdAndDelete(order._id);
    return res.status(500).json({ success: false, message: "Unable to place purchase order." });
  }
};

const placeListingOrderStripe = async (req, res) => {
  let order;
  try {
    const { listingId, address } = req.body;
    const checkout = await validateListingCheckout(req.userId, listingId, address);
    if (checkout.error) {
      return res.status(400).json({ success: false, message: checkout.error });
    }
    const { origin } = req.headers;
    if (!origin) {
      return res.status(400).json({ success: false, message: "Checkout origin is required." });
    }
    order = await createListingPurchaseOrder({
      userId: req.userId,
      listing: checkout.listing,
      address,
      itemPrice: checkout.itemPrice,
      totalAmount: checkout.totalAmount,
      paymentMethod: "stripe",
    });
    const { reserved, reservationExpiresAt } = await reserveListingForPayment(checkout.listing, order);
    if (!reserved) {
      await orderModel.findByIdAndDelete(order._id);
      return res.status(409).json({ success: false, message: "This listing was just purchased by someone else." });
    }
    const expiresAt = Math.floor(reservationExpiresAt.getTime() / 1000);
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: checkout.listing.title },
            unit_amount: checkout.itemPrice * 100,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "inr",
            product_data: { name: "Delivery fee" },
            unit_amount: LISTING_DELIVERY_FEE * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      expires_at: expiresAt,
      success_url: `${origin}/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/listing/${checkout.listing._id}?canceled=1&orderId=${order._id}`,
    });
    if (!session.url) throw new Error("Stripe checkout session did not include a redirect URL.");
    order.stripeSessionId = session.id;
    await order.save();
    return res.status(201).json({
      success: true,
      order,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Failed to create listing Stripe checkout:", error);
    if (order) {
      await releaseListingOrder(order);
      await orderModel.findByIdAndDelete(order._id);
    }
    return res.status(500).json({ success: false, message: "Unable to start Stripe checkout." });
  }
};

const placeListingOrderRazorpay = async (req, res) => {
  let order;
  try {
    const { listingId, address } = req.body;
    const checkout = await validateListingCheckout(req.userId, listingId, address);
    if (checkout.error) {
      return res.status(400).json({ success: false, message: checkout.error });
    }
    order = await createListingPurchaseOrder({
      userId: req.userId,
      listing: checkout.listing,
      address,
      itemPrice: checkout.itemPrice,
      totalAmount: checkout.totalAmount,
      paymentMethod: "razorpay",
    });
    const { reserved, reservationExpiresAt } = await reserveListingForPayment(checkout.listing, order);
    if (!reserved) {
      await orderModel.findByIdAndDelete(order._id);
      return res.status(409).json({ success: false, message: "This listing was just purchased by someone else." });
    }
    const razorpayInstance = getRazorpayInstance();
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: checkout.totalAmount * 100,
      currency: "INR",
      receipt: `listing_${order._id.toString().slice(-16)}`,
    });
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();
    return res.status(201).json({
      success: true,
      order,
      keyId: getRazorpayCredentials().keyId,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch (error) {
    logRazorpayCheckoutError("Failed to create listing Razorpay checkout:", error);
    if (order) {
      await releaseListingOrder(order);
      await orderModel.findByIdAndDelete(order._id);
    }
    return res.status(500).json({
      success: false,
      message: getRazorpayCheckoutErrorMessage(error),
    });
  }
};

const cancelListingOrder = async (req, res) => {
  try {
    const order = await orderModel.findOne({
      _id: req.params.orderId,
      userId: req.userId,
      source: "listing",
      payment: false,
      status: "pending",
      paymentMethod: { $in: ["stripe", "razorpay"] },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Pending listing purchase not found." });
    }
    if (order.paymentMethod === "razorpay") {
      const { reservationExpiresAt } =
        await listingModel.findOne({ purchaseOrder: order._id }).select("reservationExpiresAt") || {};
      if (!reservationExpiresAt || reservationExpiresAt > new Date()) {
        return res.status(409).json({
          success: false,
          message: "The listing remains reserved until the Razorpay checkout expires.",
        });
      }
    } else if (order.stripeSessionId) {
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      if (session.payment_status === "paid") {
        return res.status(409).json({ success: false, message: "This purchase has already been paid." });
      }
      if (session.status === "open") {
        await stripe.checkout.sessions.expire(order.stripeSessionId);
      }
    }
    const cancelledOrder = await orderModel.findOneAndUpdate(
      { _id: order._id, status: "pending", payment: false },
      { $set: { status: "cancelled" } },
      { new: true },
    );
    if (!cancelledOrder) {
      return res.status(409).json({ success: false, message: "Purchase checkout is no longer active." });
    }
    await releaseListingOrder(order);
    return res.status(200).json({ success: true, message: "Listing reservation released." });
  } catch (error) {
    console.error("Failed to cancel listing checkout:", error);
    return res.status(500).json({ success: false, message: "Unable to cancel listing checkout." });
  }
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

    if (order.source === "listing") {
      if (!(await completeListingPurchase(order))) {
        return res.status(409).json({
          success: false,
          message: "This listing reservation expired. Please start checkout again.",
        });
      }
    }
    if (!order.payment) {
      order.payment = true;
      if (order.source === "listing") order.status = "processing";
      await order.save();
    }
    if (order.source !== "listing") {
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
    }

    return res.status(200).json({
      success: true,
      message: "Stripe payment verified successfully.",
      source: order.source,
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
    logRazorpayCheckoutError("Error creating Razorpay order:", error);
    return res.status(500).json({
      success: false,
      message: getRazorpayCheckoutErrorMessage(error),
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

    if (order.source === "listing") {
      if (!(await completeListingPurchase(order))) {
        return res.status(409).json({
          success: false,
          message: "This listing reservation expired. Please start checkout again.",
        });
      }
    }
    if (!order.payment) {
      order.payment = true;
      order.razorpayPaymentId = razorpay_payment_id;
      if (order.source === "listing") order.status = "processing";
      await order.save();
    }
    if (order.source !== "listing") {
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
    }

    return res.status(200).json({
      success: true,
      message: "Razorpay payment verified successfully.",
      source: order.source,
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
    const orders = await orderModel
      .find({
        userId: req.userId,
        $or: [{ paymentMethod: "cod" }, { payment: true }],
      })
      .populate("items.productId")
      .populate({
        path: "items.listingId",
        populate: { path: "owner", select: "name city state" },
      })
      .populate("statusUpdatedBy", "name")
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

const getSellerOrders = async (req, res) => {
  try {
    const listings = await listingModel
      .find({ owner: req.userId })
      .select("_id");
    const listingIds = listings.map((listing) => listing._id);
    if (listingIds.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const orders = await orderModel
      .find({
        source: "listing",
        status: { $in: ["processing", "shipped", "delivered"] },
        "items.listingId": { $in: listingIds },
      })
      .populate("userId", "name email")
      .populate("items.listingId", "title images size owner")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Failed to load seller orders:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load sales and fulfillment orders.",
    });
  }
};

const updateSellerOrderStatus = async (req, res) => {
  const nextStatusByCurrentStatus = {
    processing: "shipped",
    shipped: "delivered",
  };
  try {
    const listings = await listingModel
      .find({ owner: req.userId })
      .select("_id");
    const listingIds = listings.map((listing) => listing._id);
    if (listingIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "This order does not belong to one of your listings.",
      });
    }

    const order = await orderModel.findOne({
      _id: req.params.orderId,
      source: "listing",
      status: { $in: Object.keys(nextStatusByCurrentStatus) },
      "items.listingId": { $in: listingIds },
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "An active order for one of your listings was not found.",
      });
    }

    const nextStatus = nextStatusByCurrentStatus[order.status];
    if (req.body.status !== nextStatus) {
      return res.status(400).json({
        success: false,
        message: `This order can only be updated to ${nextStatus}.`,
      });
    }

    order.status = nextStatus;
    order.statusUpdatedBy = req.userId;
    order.statusUpdatedAt = new Date();
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order marked ${nextStatus}.`,
      order,
    });
  } catch (error) {
    console.error("Failed to update seller order status:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update order status.",
    });
  }
};

export {
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
};
