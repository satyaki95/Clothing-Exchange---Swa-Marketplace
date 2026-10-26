import userModel from "../models/user.model.js";
import listingModel from "../models/listing.model.js";

// add product to user cart
const addToCart = async (req, res) => {
  try {
    const { userId, itemId, size } = req.body;

    const userData = await userModel.findById(userId);
    let cartData = await userData.cartData;

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }

    await userModel.findByIdAndUpdate(userId, { cartData }, {
      returnDocument: "after",
    });

    res
      .status(200)
      .json({ success: true, message: "Product added to cart successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error adding product to cart",
    });
  }
};

// update product in user cart
const updateCart = async (req, res) => {
  try {
    const { userId, itemId, size, quantity } = req.body;

    const userData = await userModel.findById(userId);
    let cartData = await userData.cartData;

    if (cartData[itemId] && cartData[itemId][size] !== undefined) {
      if (quantity <= 0) {
        delete cartData[itemId][size];
        if (Object.keys(cartData[itemId]).length === 0) {
          delete cartData[itemId];
        }
      } else {
        cartData[itemId][size] = quantity;
      }
    }

    await userModel.findByIdAndUpdate(userId, { cartData }, {
      returnDocument: "after",
    });

    res
      .status(200)
      .json({ success: true, message: "Cart updated successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating cart",
    });
  }
};

// get user cart data
const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId);
    const cartData = await userData.cartData;
    const listingCartData = userData.listingCartData || [];

    res.status(200).json({ success: true, cartData, listingCartData });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching user cart",
    });
  }
};

const getListingCart = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select("listingCartData");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const listings = await listingModel
      .find({ _id: { $in: user.listingCartData || [] } })
      .select("title description images category size brand condition estimatedValue status owner createdAt")
      .populate("owner", "name city state");
    const cartListings = listings.map((listing) => {
      const item = listing.toObject();
      item.canBuy =
        item.status === "available" &&
        item.owner?._id.toString() !== req.userId;
      return item;
    });

    res.status(200).json({ success: true, listings: cartListings });
  } catch (error) {
    console.error("Failed to load marketplace cart listings:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load marketplace cart listings.",
    });
  }
};

const addListingToCart = async (req, res) => {
  try {
    const listing = await listingModel.findOne({
      _id: req.body.listingId,
      owner: { $ne: req.userId },
      status: "available",
    }).select("_id");
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Available listing not found",
      });
    }

    const user = await userModel.findByIdAndUpdate(
      req.userId,
      { $addToSet: { listingCartData: listing._id } },
      { new: true },
    ).select("listingCartData");
    res.status(200).json({
      success: true,
      listingCartData: user.listingCartData,
      message: "Listing added to cart",
    });
  } catch (error) {
    console.error("Failed to add listing to cart:", error);
    res.status(500).json({
      success: false,
      message: "Unable to add listing to cart.",
    });
  }
};

const removeListingFromCart = async (req, res) => {
  try {
    const user = await userModel.findByIdAndUpdate(
      req.userId,
      { $pull: { listingCartData: req.body.listingId } },
      { new: true },
    ).select("listingCartData");
    res.status(200).json({
      success: true,
      listingCartData: user.listingCartData,
      message: "Listing removed from cart",
    });
  } catch (error) {
    console.error("Failed to remove listing from cart:", error);
    res.status(500).json({
      success: false,
      message: "Unable to remove listing from cart.",
    });
  }
};

export {
  addToCart,
  updateCart,
  getUserCart,
  getListingCart,
  addListingToCart,
  removeListingFromCart,
};
