import { handleRedirectService, getUrlStatsService } from "../services/urls.service.js";
import { logInfo, logError } from "../utils/logger.js";

const getRedirectUrl = async (req, res) => {
  const { shortCode } = req.params;

  try {
    const result = await handleRedirectService(shortCode);

    if (result.status === "not_found") {
      return res.status(404).json({ message: "Short URL not found" });
    }

    if (result.status === "expired") {
      return res.status(410).json({ message: "This short URL has expired" });
    }

    logInfo(
      `Redirecting to ${result.redirectTo} | Total Clicks: ${result.clicks}`
    );
    return res.redirect(302, result.redirectTo);
  } catch (error) {
    logError(`Redirection failed for ${shortCode}: ${error.message}`);
    res.status(500).json({ message: "Error during redirection" });
  }
};

const getUrlStats = async (req, res) => {
  try {
    const stats = await getUrlStatsService(req.params.shortCode, req.user.id);
    if (!stats) {
      return res
        .status(404)
        .json({ message: "Stats not found or unauthorized" });
    }
    res.status(200).json(stats);
  } catch (err) {
    logError("Failed to get URL stats", err);
    res.status(500).json({ message: "Failed to retrieve stats" });
  }
};

export { getRedirectUrl, getUrlStats };
