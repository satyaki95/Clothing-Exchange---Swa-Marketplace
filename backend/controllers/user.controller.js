// Route for user login
const loginUser = async (req, res) => {};

// Route for user registration
const registerUser = async (req, res) => {
  res.status(200).json({ message: "User registered successfully" });
};

// Route for Admin login
const adminLogin = async (req, res) => {};

export { loginUser, registerUser, adminLogin };
