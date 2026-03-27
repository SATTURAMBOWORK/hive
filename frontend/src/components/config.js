const DEFAULT_BACKEND_ORIGIN = "http://localhost:5001";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${DEFAULT_BACKEND_ORIGIN}/api`;
export const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_BASE_URL || DEFAULT_BACKEND_ORIGIN;
