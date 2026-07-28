const normalizeUrl = (value) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const parsed = new URL(trimmed);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('VITE_API_URL must use HTTP or HTTPS');
  }
  if (!import.meta.env.DEV && parsed.protocol !== 'https:') {
    throw new Error('VITE_API_URL must use HTTPS outside development');
  }
  return trimmed.replace(/\/+$/, '');
};

export const API_BASE_URL = normalizeUrl(import.meta.env.VITE_API_URL);

export const API_CONFIGURATION_ERROR = API_BASE_URL
  ? null
  : 'VITE_API_URL is required before the admin console can contact Vybe.';
