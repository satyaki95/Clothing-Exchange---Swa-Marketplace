import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

const optionalAuth = async (req, res, next) => {
  const token = req.get("token");
  if (!token) {
    return next();
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
    req.userId = user._id.toString();
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default optionalAuth;
