import express from "express";
import {
  addToCart,
  updateCart,
  getUserCart,
  getListingCart,
  addListingToCart,
  removeListingFromCart,
} from "../controllers/cart.controller.js";
import authUser from "../middleware/auth.js";

const cartRouter = express.Router();

cartRouter.post("/get", authUser, getUserCart);
cartRouter.post("/add", authUser, addToCart);
cartRouter.put("/update", authUser, updateCart);
cartRouter.get("/listing/items", authUser, getListingCart);
cartRouter.post("/listing/add", authUser, addListingToCart);
cartRouter.post("/listing/remove", authUser, removeListingFromCart);

export default cartRouter;
