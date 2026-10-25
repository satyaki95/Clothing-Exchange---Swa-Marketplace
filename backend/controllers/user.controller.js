import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

// Function to create JWT token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Route for user login
const loginUser = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    if (!email || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "This account is suspended. Contact support for assistance.",
      });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(user._id);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        city: user.city,
        state: user.state,
        postalCode: user.postalCode,
      },
    });
  } catch (error) {
    console.error("Failed to log in user:", error);
    res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
};

// Route for user registration
const registerUser = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // validating email format and strong password
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new userModel({ name, email, password: hashedPassword });

    const user = await newUser.save();

    const token = createToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Failed to register user:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create your account. Please try again.",
    });
  }
};

// Route for Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user is an admin
    if (
      !process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      token,
    });
  } catch (error) {
    console.error("Failed to log in admin:", error);
    res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.userId)
      .select("name email city state postalCode location createdAt");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Failed to load profile:", error);
    res.status(500).json({ success: false, message: "Unable to load profile." });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, city, state, postalCode, latitude, longitude } = req.body;
    const update = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof city === "string") update.city = city.trim();
    if (typeof state === "string") update.state = state.trim();
    if (typeof postalCode === "string") update.postalCode = postalCode.trim();

    if (latitude !== undefined || longitude !== undefined) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return res.status(400).json({
          success: false,
          message: "Enter valid latitude and longitude coordinates",
        });
      }
      update.location = { latitude: lat, longitude: lng };
    }

    const user = await userModel
      .findByIdAndUpdate(req.userId, { $set: update }, { new: true, runValidators: true })
      .select("name email city state postalCode location createdAt");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({ success: false, message: "Unable to update profile." });
  }
};

export { loginUser, registerUser, adminLogin, getProfile, updateProfile };
