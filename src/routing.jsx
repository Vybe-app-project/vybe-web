import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ADMIN_BASE_PATH = '/admin';
const RoutingContext = createContext(null);

const currentRoute = () => {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  if (pathname === ADMIN_BASE_PATH) return '/';
  if (pathname.startsWith(`${ADMIN_BASE_PATH}/`)) {
    return pathname.slice(ADMIN_BASE_PATH.length) || '/';
  }
  return '/';
};

export const AdminRouter = ({ children }) => {
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const handlePopState = () => setRoute(currentRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((destination, options = {}) => {
    const normalized = destination === '/' ? '/' : `/${destination.replace(/^\/+/, '')}`;
    const target = normalized === '/' ? ADMIN_BASE_PATH : `${ADMIN_BASE_PATH}${normalized}`;
    window.history[options.replace ? 'replaceState' : 'pushState']({}, '', target);
    setRoute(normalized);
  }, []);

  const value = useMemo(() => ({ route, navigate }), [navigate, route]);
  return <RoutingContext.Provider value={value}>{children}</RoutingContext.Provider>;
};

export const useAdminRouter = () => {
  const context = useContext(RoutingContext);
  if (!context) throw new Error('useAdminRouter must be used inside AdminRouter');
  return context;
};
