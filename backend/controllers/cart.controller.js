import userModel from "../models/user.model.js";

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

    res.status(200).json({ success: true, cartData });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching user cart",
    });
  }
};

export { addToCart, updateCart, getUserCart };
