import express from "express";
import {
  getSummary,
  listListings,
  listSwaps,
  listUsers,
  updateUserSuspension,
  removeListing,
  resolveDispute,
} from "../controllers/admin.controller.js";
import adminAuth from "../middleware/adminAuth.js";

const adminRouter = express.Router();

adminRouter.use(adminAuth);
adminRouter.get("/summary", getSummary);
adminRouter.get("/users", listUsers);
adminRouter.patch("/users/:id/suspension", updateUserSuspension);
adminRouter.get("/listings", listListings);
adminRouter.patch("/listings/:id/remove", removeListing);
adminRouter.get("/swaps", listSwaps);
adminRouter.patch("/swaps/:id/resolve", resolveDispute);

export default adminRouter;
