import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

const authUser = async (req, res, next) => {
  const token = req.get("token");

  if (!token) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Authentication required. Please sign in.",
      });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("_id isSuspended");
    if (!user || user.isSuspended) {
      return res.status(401).json({
        success: false,
        message: "This account is unavailable. Please contact support.",
      });
    }
    if (!req.body) req.body = {};
    req.body.userId = decoded.id;
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default authUser;
