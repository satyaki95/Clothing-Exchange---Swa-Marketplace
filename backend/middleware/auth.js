import jwt from "jsonwebtoken";

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
    req.body.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default authUser;
