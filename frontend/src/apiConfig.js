/**
 * Centralized API Configuration for TakaBondhu
 * Supports:
 * 1. Unified container deployment (Express serving frontend/dist -> API_BASE is empty string, relative URLs used)
 * 2. Separate frontend deployment (e.g. Vercel pointing to Render backend -> VITE_API_BASE or VITE_API_URL)
 * 3. Dynamic runtime overrides via localStorage or window.__TAKA_BONDHU_API_BASE__
 */

export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const override = window.__TAKA_BONDHU_API_BASE__ || localStorage.getItem('takabondhu_api_base') || localStorage.getItem('takabondhu_api_url');
    if (override && typeof override === 'string' && override.trim()) {
      return override.trim().replace(/\/$/, '');
    }
  }

  const envBase = (
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    ''
  ).trim();

  return envBase.replace(/\/$/, '');
};

export const API_BASE = getApiBase();

export function apiUrl(endpoint) {
  const base = getApiBase();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

export function isVercelStandaloneWithoutBackend() {
  if (typeof window === 'undefined') return false;
  const isVercel = window.location.hostname.endsWith('.vercel.app');
  const hasBase = Boolean(getApiBase());
  return isVercel && !hasBase;
}

/**
 * Robust fetch wrapper that gracefully checks for JSON Content-Type
 * and alerts with actionable guidance if HTML error pages are returned.
 */
export async function safeFetchJson(endpoint, options = {}) {
  const url = apiUrl(endpoint);
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      const err = new Error(
        `Backend API unreachable at ${url}. If frontend is on Vercel, ensure VITE_API_BASE or VITE_API_URL is configured in Vercel settings to your Render backend URL.`
      );
      err.isHtmlResponse = true;
      err.status = res.status;
      throw err;
    }
    throw new Error(`Unexpected non-JSON response from ${endpoint}: ${text.slice(0, 100)}`);
  }

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with HTTP ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

