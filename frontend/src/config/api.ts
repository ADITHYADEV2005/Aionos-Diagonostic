// Centralized API configuration for Aionos Diagnostics
// Resolves backend URLs dynamically based on environment variables for local dev and cloud deployment.

const getCleanUrl = (url: string | undefined, fallback: string): string => {
  const base = (url && url.trim()) ? url.trim() : fallback;
  return base.replace(/\/+$/, "");
};

export const AUTH_API_URL = getCleanUrl(
  import.meta.env.VITE_AUTH_API_URL || import.meta.env.VITE_API_URL,
  "http://localhost:5000/api"
);

export const AI_API_URL = getCleanUrl(
  import.meta.env.VITE_AI_API_URL,
  "http://localhost:8000/api"
);
