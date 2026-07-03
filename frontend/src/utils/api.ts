const BASE_URL = "http://127.0.0.1:8000/api";
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

export const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getHeaders(),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errMessage = `API Error: ${response.status}`;
      try {
        const errData = await response.json();
        errMessage = errData?.detail || errData?.message || errMessage;
      } catch {
        const errText = await response.text().catch(() => "");
        if (errText) errMessage = errText;
      }
      throw new Error(errMessage);
    }

    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check if the backend server is running.");
    }
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Cannot connect to the backend server. Please ensure it is running on http://localhost:8000.");
    }
    throw err;
  }
};
