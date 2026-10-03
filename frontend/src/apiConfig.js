/**
 * Centralized API Configuration for TakaBondhu
 * Supports:
 * 1. Single-domain production (Express serving frontend/dist -> API_BASE is empty string, relative URLs used)
 * 2. Separate frontend deployment (e.g. Vercel/Netlify pointing to Render backend -> VITE_API_BASE)
 */

export const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export function apiUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
}
