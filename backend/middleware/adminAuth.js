import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      throw new Error("No token provided");
    }

    let token_decode = jwt.verify(token, process.env.JWT_SECRET);

    token_decode = token_decode.id;

    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
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
