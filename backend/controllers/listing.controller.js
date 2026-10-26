import { v2 as cloudinary } from "cloudinary";
import listingModel from "../models/listing.model.js";
import orderModel from "../models/order.model.js";
import userModel from "../models/user.model.js";
import estimateSwapValue from "../utils/swapValue.js";

const publicListingFields = "title description images category size brand condition estimatedValue status owner createdAt";
const memberListingFields = `${publicListingFields} buyingPrice`;

const parseBuyingPrice = (value) => {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    String(value).trim() === ""
  ) {
    return null;
  }
  const buyingPrice = Number(value);
  return Number.isFinite(buyingPrice) && buyingPrice >= 0 ? buyingPrice : null;
};

const releaseExpiredPurchaseReservations = async () => {
  const expired = await listingModel
    .find({
      status: "reserved",
      purchaseOrder: { $ne: null },
      reservationExpiresAt: { $lte: new Date() },
    })
    .select("_id purchaseOrder");
  if (expired.length === 0) return;

  await orderModel.updateMany(
    {
      _id: { $in: expired.map((item) => item.purchaseOrder) },
      status: "pending",
      payment: false,
    },
    { $set: { status: "cancelled" } },
  );
  await listingModel.updateMany(
    { _id: { $in: expired.map((item) => item._id) }, status: "reserved" },
    {
      $set: {
        status: "available",
        purchaseOrder: null,
        reservationExpiresAt: null,
      },
    },
  );
};

const listListings = async (req, res) => {
  try {
    await releaseExpiredPurchaseReservations();
    const { category, size, condition, city, maxDistance } = req.query;
    const filter = { status: "available" };
    if (req.userId) filter.owner = { $ne: req.userId };
    if (category) filter.category = category;
    if (size) filter.size = size;
    if (condition) filter.condition = condition;

    let listings = await listingModel
      .find(filter)
      .select(publicListingFields)
      .populate("owner", "name city state location")
      .sort({ createdAt: -1 });

    if (city) {
      const normalizedCity = String(city).trim().toLowerCase();
      listings = listings.filter((item) => item.owner?.city?.toLowerCase() === normalizedCity);
    }
    if (req.query.nearby === "true") {
      const user = await userModel.findById(req.userId).select("location");
      if (
        !Number.isFinite(user?.location?.latitude) ||
        !Number.isFinite(user?.location?.longitude)
      ) {
        return res.status(400).json({
          success: false,
          message: "Add your location coordinates to find nearby listings",
        });
      }
      const radius = Math.min(Math.max(Number(maxDistance) || 50, 1), 500);
      listings = listings.map((item) => {
        const point = item.owner?.location;
        if (
          !Number.isFinite(point?.latitude) ||
          !Number.isFinite(point?.longitude)
        ) return null;
        const radians = (degrees) => (degrees * Math.PI) / 180;
        const dLat = radians(point.latitude - user.location.latitude);
        const dLng = radians(point.longitude - user.location.longitude);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(radians(user.location.latitude)) *
            Math.cos(radians(point.latitude)) *
            Math.sin(dLng / 2) ** 2;
        const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return distance <= radius
          ? { ...item.toObject(), distanceKm: Math.round(distance * 10) / 10 }
          : null;
      }).filter(Boolean);
      listings.sort((left, right) => left.distanceKm - right.distanceKm);
    }
    const publicListings = listings.map((item) => {
      const listing = typeof item.toObject === "function" ? item.toObject() : item;
      if (listing.owner) delete listing.owner.location;
      return listing;
    });
    res.status(200).json({ success: true, listings: publicListings });
  } catch (error) {
    console.error("Failed to load clothing listings:", error);
    res.status(500).json({ success: false, message: "Unable to load listings." });
  }
};

const getMyListings = async (req, res) => {
  try {
    const listings = await listingModel
      .find({ owner: req.userId })
      .select(memberListingFields)
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error("Failed to load user's listings:", error);
    res.status(500).json({ success: false, message: "Unable to load your listings." });
  }
};

const getListingById = async (req, res) => {
  try {
    await releaseExpiredPurchaseReservations();
    const filter = { _id: req.params.id, status: "available" };
    if (req.userId) filter.owner = { $ne: req.userId };
    const listing = await listingModel
      .findOne(filter)
      .select(publicListingFields)
      .populate("owner", "name city state");
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Available clothing listing not found",
      });
    }
    res.status(200).json({ success: true, listing });
  } catch (error) {
    console.error("Failed to load clothing listing:", error);
    res.status(500).json({ success: false, message: "Unable to load listing." });
  }
};

const createListing = async (req, res) => {
  try {
    const { title, description, category, size, brand, condition } = req.body;
    if (!title?.trim() || !description?.trim() || !category || !size || !condition) {
      return res.status(400).json({
        success: false,
        message: "Title, description, category, size, and condition are required",
      });
    }
    const buyingPrice = parseBuyingPrice(req.body.buyingPrice);
    if (buyingPrice === null) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid buying price of zero or more",
      });
    }
    if (!["New with tags", "Like new", "Good", "Fair"].includes(condition)) {
      return res.status(400).json({ success: false, message: "Choose a valid condition" });
    }
    if (!req.files?.length) {
      return res.status(400).json({ success: false, message: "Upload at least one clothing image" });
    }
    const images = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: "image",
          folder: "clothing-exchange-marketplace/listings",
        });
        return result.secure_url;
      }),
    );
    const listing = await listingModel.create({
      owner: req.userId,
      title: title.trim(),
      description: description.trim(),
      images,
      category,
      size,
      brand: brand?.trim() || "Unbranded",
      condition,
      buyingPrice,
      estimatedValue: estimateSwapValue({ category, condition, brand, buyingPrice }),
    });
    res.status(201).json({ success: true, listing });
  } catch (error) {
    console.error("Failed to create clothing listing:", error);
    res.status(500).json({ success: false, message: "Unable to create listing." });
  }
};

const updateListing = async (req, res) => {
  try {
    const allowed = ["title", "description", "category", "size", "brand", "condition"];
    const updates = {};
    for (const field of allowed) {
      if (typeof req.body[field] === "string") updates[field] = req.body[field].trim();
    }
    if (req.body.buyingPrice !== undefined) {
      const buyingPrice = parseBuyingPrice(req.body.buyingPrice);
      if (buyingPrice === null) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid buying price of zero or more",
        });
      }
      updates.buyingPrice = buyingPrice;
    }
    if (updates.condition && !["New with tags", "Like new", "Good", "Fair"].includes(updates.condition)) {
      return res.status(400).json({ success: false, message: "Choose a valid condition" });
    }
    const listing = await listingModel.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId, status: "available" },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!listing) {
      return res.status(404).json({ success: false, message: "Available listing not found" });
    }
    if (updates.category || updates.condition || updates.brand || updates.buyingPrice !== undefined) {
      listing.estimatedValue = estimateSwapValue(listing);
      await listing.save();
    }
    res.status(200).json({ success: true, listing });
  } catch (error) {
    console.error("Failed to update clothing listing:", error);
    res.status(500).json({ success: false, message: "Unable to update listing." });
  }
};

const removeListing = async (req, res) => {
  try {
    const listing = await listingModel.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId, status: "available" },
      { $set: { status: "removed" } },
      { new: true },
    );
    if (!listing) {
      return res.status(404).json({ success: false, message: "Available listing not found" });
    }
    res.status(200).json({ success: true, message: "Listing removed" });
  } catch (error) {
    console.error("Failed to remove clothing listing:", error);
    res.status(500).json({ success: false, message: "Unable to remove listing." });
  }
};

const estimateValue = (req, res) => {
  const { category, condition, brand } = req.body;
  if (!category || !condition) {
    return res.status(400).json({ success: false, message: "Category and condition are required" });
  }
  let buyingPrice;
  if (req.body.buyingPrice !== undefined) {
    buyingPrice = parseBuyingPrice(req.body.buyingPrice);
    if (buyingPrice === null) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid buying price of zero or more",
      });
    }
  }
  res.status(200).json({
    success: true,
    estimatedValue: estimateSwapValue({ category, condition, brand, buyingPrice }),
  });
};

export {
  listListings,
  getMyListings,
  getListingById,
  createListing,
  updateListing,
  removeListing,
  estimateValue,
};
