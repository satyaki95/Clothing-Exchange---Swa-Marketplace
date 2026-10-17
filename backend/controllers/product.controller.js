import productModel from "../models/product.model.js";
import { v2 as cloudinary } from "cloudinary";

// function for add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestSeller,
    } = req.body;

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined,
    );

    let imageUrls = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
          folder: "clothing-exchange-marketplace",
        });

        return result.secure_url;
      }),
    );

    const productData = {
      name,
      description,
      category,
      subCategory,
      price: Number(price),
      bestSeller: bestSeller === "true" ? true : false,
      sizes: JSON.parse(sizes),
      image: imageUrls,
      date: new Date(),
    };

    const product = new productModel(productData);
    await product.save();

    res
      .status(201)
      .json({ success: true, message: "Product added successfully" });
  } catch (error) {
    console.error("Failed to add product:", error);
    res.status(500).json({ success: false, message: "Unable to add product. Please try again." });
  }
};

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

export { addProduct, listProducts, removeProduct, singleProduct };
