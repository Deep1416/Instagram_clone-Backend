import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    // Retrieve the token from the cookie
    const token = req.cookies.token; // Corrected 'cookie' to 'cookies'
    if (!token) {
      return res.status(401).json({
        message: "User is not authenticated",
        success: false,
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (!decoded) {
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    // Attach user information to the request object
    req.id = decoded.userId;
    next(); // Proceed to the next middleware or route handler

  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export default isAuthenticated;
