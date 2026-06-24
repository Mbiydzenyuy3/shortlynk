//src/utils/oauthState.js
import jwt from "jsonwebtoken";

export function generateOAuthState() {
  return jwt.sign(
    { createdAt: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: "45m" } // Short expiry
  );
}

export function verifyOAuthState(stateToken) {
  try {
    return jwt.verify(stateToken, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}
