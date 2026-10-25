import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      throw new Error("No token provided");
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    if (token_decode.admin !== true) {
      throw new Error("Invalid admin credentials");
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Please authenticate as an admin",
    });
  }
};

export default adminAuth;
