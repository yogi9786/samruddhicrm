export const getApiBaseUrl = (): string => {
  const value = (import.meta.env.VITE_API_URL || "/api").trim();
  if (!value || value === "/") {
    return "/api";
  }
  return value.replace(/\/+$/, "");
};

export const BASE_URL = getApiBaseUrl();
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

export const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Guard against accidental double /api/ prefix if passed by caller
  if (BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.substring(4);
  }

  const url = `${BASE_URL}${cleanEndpoint}`;
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
      throw new Error("Cannot connect to the backend server. Please ensure it is running.");
    }
    throw err;
  }
};
