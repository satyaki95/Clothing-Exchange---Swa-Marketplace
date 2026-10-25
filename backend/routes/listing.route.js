import express from "express";
import {
  createListing,
  estimateValue,
  getMyListings,
  listListings,
  removeListing,
  updateListing,
} from "../controllers/listing.controller.js";
import authUser from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const listingRouter = express.Router();

listingRouter.post("/estimate", estimateValue);
listingRouter.get("/nearby", authUser, listListings);
listingRouter.get("/", listListings);
listingRouter.get("/mine", authUser, getMyListings);
listingRouter.post("/", authUser, upload.array("images", 5), createListing);
listingRouter.put("/:id", authUser, updateListing);
listingRouter.delete("/:id", authUser, removeListing);

export default listingRouter;
