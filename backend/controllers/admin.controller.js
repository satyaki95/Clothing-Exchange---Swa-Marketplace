import listingModel from "../models/listing.model.js";
import swapModel from "../models/swap.model.js";
import userModel from "../models/user.model.js";

const getSummary = async (req, res) => {
  try {
    const [users, listings, swaps, activeListings, completedSwaps, openDisputes] =
      await Promise.all([
        userModel.countDocuments(),
        listingModel.countDocuments(),
        swapModel.countDocuments(),
        listingModel.countDocuments({ status: "available" }),
        swapModel.countDocuments({ status: "completed" }),
        swapModel.countDocuments({ status: "disputed" }),
      ]);
    res.status(200).json({
      success: true,
      analytics: { users, listings, swaps, activeListings, completedSwaps, openDisputes },
    });
  } catch (error) {
    console.error("Failed to load admin analytics:", error);
    res.status(500).json({ success: false, message: "Unable to load analytics." });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await userModel
      .find()
      .select("name email city state isSuspended createdAt")
      .sort({ createdAt: -1 })
      .limit(500);
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Failed to load users for admin:", error);
    res.status(500).json({ success: false, message: "Unable to load users." });
  }
};

const updateUserSuspension = async (req, res) => {
  try {
    const isSuspended = req.body.isSuspended;
    if (typeof isSuspended !== "boolean") {
      return res.status(400).json({ success: false, message: "isSuspended must be a boolean" });
    }
    const user = await userModel.findByIdAndUpdate(
      req.params.id,
      { $set: { isSuspended } },
      { new: true },
    ).select("name email isSuspended");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Failed to update user status:", error);
    res.status(500).json({ success: false, message: "Unable to update user status." });
  }
};

const listListings = async (req, res) => {
  try {
    const listings = await listingModel
      .find()
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .limit(500);
    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error("Failed to load listings for admin:", error);
    res.status(500).json({ success: false, message: "Unable to load listings." });
  }
};

const removeListing = async (req, res) => {
  try {
    const listing = await listingModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "removed" } },
      { new: true },
    );
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }
    if (listing.reservedBy) {
      const swap = await swapModel.findByIdAndUpdate(
        listing.reservedBy,
        {
          $set: {
            status: "cancelled",
            resolution: "Cancelled by an administrator after listing moderation.",
            resolvedAt: new Date(),
          },
        },
        { new: true },
      );
      if (swap) {
        await listingModel.updateMany(
          { reservedBy: swap._id },
          { $set: { status: "available", reservedBy: null } },
        );
        await listingModel.updateOne(
          { _id: listing._id },
          { $set: { status: "removed" }, $unset: { reservedBy: 1 } },
        );
      }
    }
    res.status(200).json({ success: true, message: "Listing removed" });
  } catch (error) {
    console.error("Failed to moderate listing:", error);
    res.status(500).json({ success: false, message: "Unable to moderate listing." });
  }
};

const listSwaps = async (req, res) => {
  try {
    const swaps = await swapModel
      .find({ status: req.query.status || { $in: ["disputed", "requested", "accepting", "accepted"] } })
      .populate("fromUser toUser", "name email")
      .populate("offeredListing requestedListing", "title images status estimatedValue")
      .sort({ updatedAt: -1 })
      .limit(500);
    res.status(200).json({ success: true, swaps });
  } catch (error) {
    console.error("Failed to load swaps for admin:", error);
    res.status(500).json({ success: false, message: "Unable to load swaps." });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { outcome, resolution } = req.body;
    if (!["completed", "cancelled"].includes(outcome) || !resolution?.trim()) {
      return res.status(400).json({ success: false, message: "Choose an outcome and add a resolution note" });
    }
    const swap = await swapModel.findOneAndUpdate(
      { _id: req.params.id, status: "disputed" },
      { $set: { status: outcome, resolution: resolution.trim(), resolvedAt: new Date() } },
      { new: true },
    );
    if (!swap) {
      return res.status(404).json({ success: false, message: "Open dispute not found" });
    }
    await listingModel.updateMany(
      { reservedBy: swap._id },
      outcome === "completed"
        ? { $set: { status: "swapped" }, $unset: { reservedBy: 1 } }
        : { $set: { status: "available", reservedBy: null } },
    );
    res.status(200).json({ success: true, swap });
  } catch (error) {
    console.error("Failed to resolve swap dispute:", error);
    res.status(500).json({ success: false, message: "Unable to resolve dispute." });
  }
};

export {
  getSummary,
  listUsers,
  updateUserSuspension,
  listListings,
  removeListing,
  listSwaps,
  resolveDispute,
};
