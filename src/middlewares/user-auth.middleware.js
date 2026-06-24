import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { logInfo, logError, logDebug } from "../utils/logger.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    // Extract token from header
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      logInfo("Auth middleware: No token provided.");
      return res.status(401).json({ message: "Authorization token missing." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || typeof decoded !== "object") {
      logInfo("Auth middleware: Decoded token is invalid or malformed.");
      return res.status(401).json({ message: "Invalid token structure." });
    }

    // Extract user ID from token payload
    const userId = decoded.sub || decoded.id || decoded.user?.id;

    if (!userId) {
      logInfo("Auth middleware: Token payload missing user identifier.");
      return res
        .status(401)
        .json({ message: "Invalid token payload." }, JSON.stringify(decoded));
    }

    logDebug("Auth middleware: Decoded JWT payload", decoded);

    // Check that the user exists
    const result = await query(
      "SELECT id, email FROM users WHERE id = $1 LIMIT 1",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "User not found." });
    }

    // Attach user info to request
    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
    };

    logDebug(`Auth middleware: Authenticated user ID ${req.user.id}`);

    next();
  } catch (error) {
    logError("Auth middleware: Token verification failed", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }

    return res.status(500).json({
      message: "Server error during token verification.",
    });
  }
};

export { authMiddleware };
