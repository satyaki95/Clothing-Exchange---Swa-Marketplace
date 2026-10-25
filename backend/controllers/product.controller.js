import productModel from "../models/product.model.js";

// function for list product
const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Failed to load products:", error);
    res.status(500).json({ success: false, message: "Unable to load products. Please try again." });
  }
};

// function for removing product
const removeProduct = async (req, res) => {
  try {
    const id = req.body.id;

    await productModel.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Product removed successfully" });
  } catch (error) {
    console.error("Failed to remove product:", error);
    res.status(500).json({ success: false, message: "Unable to remove product. Please try again." });
  }
};

// function for single product info
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Failed to load product:", error);
    res.status(500).json({ success: false, message: "Unable to load product. Please try again." });
  }
};

export { listProducts, removeProduct, singleProduct };
