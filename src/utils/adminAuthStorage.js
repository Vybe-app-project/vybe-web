const TOKEN_KEY = 'access_token';
const LEGACY_PROFILE_KEY = 'admin_profile';
export const ADMIN_SESSION_CLEARED_EVENT = 'vybe:admin-session-cleared';

const removeLegacyCopies = () => {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_PROFILE_KEY);
  } catch {
    // Storage can be unavailable in hardened/private browser modes.
  }
};

export const getAdminToken = () => {
  removeLegacyCopies();
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAdminToken = (value) => {
  const token = typeof value === 'string' ? value.trim() : '';
  if (!token) throw new Error('A valid administrator token is required.');
  removeLegacyCopies();
  window.sessionStorage.setItem(TOKEN_KEY, token);
};

export const clearAdminSession = () => {
  removeLegacyCopies();
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing else can be done if browser storage is unavailable.
  }
  try {
    window.dispatchEvent(new Event(ADMIN_SESSION_CLEARED_EVENT));
  } catch {
    // Navigation will still be enforced on the next authenticated route check.
  }
};
