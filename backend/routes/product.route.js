import express from "express";
import {
  listProducts,
  singleProduct,
} from "../controllers/product.controller.js";

const productRouter = express.Router();

productRouter.post("/single", singleProduct);
productRouter.get("/list", listProducts);

export default productRouter;
