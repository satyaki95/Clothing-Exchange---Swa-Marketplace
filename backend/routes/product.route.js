import express from "express";
import {
  listProducts,
  removeProduct,
  singleProduct,
} from "../controllers/product.controller.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

productRouter.post("/remove", adminAuth, removeProduct);
productRouter.post("/single", singleProduct);
productRouter.get("/list", listProducts);

export default productRouter;
