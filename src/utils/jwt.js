//utils/jwt.js
import jwt from "jsonwebtoken";

// Secret key from environment variables or fallback to 'dev-secret' if not available
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
// Token expiration time
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Function to sign the JWT token
export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Function to verify the JWT token
export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);
