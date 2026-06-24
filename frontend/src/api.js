const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// A helper to attach auth headers and parse JSON
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseURL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle non-2xx HTTP responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || "Request failed");
    error.response = errorData;
    throw error;
  }

  return response.json();
}
