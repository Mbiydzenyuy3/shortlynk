import * as UrlServices from "../services/urls.service.js";
import { logError } from "../utils/logger.js";

const createShortUrl = async (req, res) => {
  const { longUrl, shortCode, expiresAt } = req.body;
  const userId = req.user.id;

  try {
    const result = await UrlServices.createShortUrlService({
      longUrl,
      shortCode,
      expireAt: expiresAt,
      userId,
    });

    res.status(201).json({
      message: "Short URL created successfully",
      ...result,
      expire_at: result.expire_at || "No expiration time",
    });
  } catch (err) {
    if (err.message.includes("short Code conflict")) {
      return res.status(409).json({ message: "Custom code already in use" });
    }
    logError("Error creating short URL:", err);
    res.status(500).json({ message: "Server error creating short URL" });
  }
};

const getUserUrls = async (req, res) => {
  try {
    const urls = await UrlServices.getUserUrlsService(req.user.id);
    if (urls.length === 0) {
      return res.status(200).json({ urls: [] });
    }
    res.status(200).json({ urls });
  } catch (err) {
    logError("Failed to retrieve user URLs", err);
    res.status(500).json({ message: "Failed to fetch user URLs" });
  }
};

export { createShortUrl, getUserUrls };
