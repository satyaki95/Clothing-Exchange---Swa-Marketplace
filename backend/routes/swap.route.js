import express from "express";
import {
  confirmSwap,
  createSwap,
  getMessages,
  listSwaps,
  reportDispute,
  respondToSwap,
  sendMessage,
} from "../controllers/swap.controller.js";
import authUser from "../middleware/auth.js";

const swapRouter = express.Router();

swapRouter.use(authUser);
swapRouter.get("/", listSwaps);
swapRouter.post("/", createSwap);
swapRouter.patch("/:id/respond", respondToSwap);
swapRouter.patch("/:id/confirm", confirmSwap);
swapRouter.post("/:id/dispute", reportDispute);
swapRouter.get("/:id/messages", getMessages);
swapRouter.post("/:id/messages", sendMessage);

export default swapRouter;
