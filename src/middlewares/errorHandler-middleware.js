import { logError } from "../utils/logger.js";
export default function errorHandler(err, req, res, next) {
  logError("Error:", err);
  const status = err.status || 500;
  const message = err.message || "Something went wrong";
  res.status(status).json({ message });
}
