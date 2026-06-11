// Single source of truth for the backend URL.
// In production, set REACT_APP_API_URL at build time (e.g. https://api.moviejunction.com).
// Falls back to the local dev server so the app runs with zero config.
export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
