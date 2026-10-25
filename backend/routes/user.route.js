import express from "express";
import {
  registerUser,
  loginUser,
  adminLogin,
  getProfile,
  updateProfile,
} from "../controllers/user.controller.js";
import authUser from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", adminLogin);
userRouter.get("/profile", authUser, getProfile);
userRouter.put("/profile", authUser, updateProfile);

export default userRouter;
