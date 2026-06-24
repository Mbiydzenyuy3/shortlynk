// src/pages/UrlListPage.jsx
import { useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import UrlList from "../components/UrlList.jsx";

export default function UrlListPage() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/api/shorten/my-urls");
        setUrls(data.urls);
      } catch (err) {
        console.error("Error fetching URLs:", err);
        setError("Failed to load URLs.");
      } finally {
        setLoading(false);
      }
    };

    fetchUrls();
  }, []);

  return (
    <div className="url-list-page">
      <h2 className="text-xl font-bold">All Shortened URLs</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error}
      <UrlList urls={urls} />
    </div>
  );
}
