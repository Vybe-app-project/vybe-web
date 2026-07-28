import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import axiosInstance from '../config/axios';
import { useAdminRouter } from '../routing';
import {
  ADMIN_SESSION_CLEARED_EVENT,
  clearAdminSession,
  getAdminToken,
} from '../utils/adminAuthStorage';

const AdminSessionContext = createContext({
  admin: null,
  error: '',
  loading: true,
  isSuperAdmin: false,
  refresh: async () => {},
});

export function AdminSessionProvider({ children }) {
  const { navigate } = useAdminRouter();
  const [session, setSession] = useState({
    admin: null,
    error: '',
    loading: true,
  });

  const refresh = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      setSession({ admin: null, error: '', loading: false });
      return null;
    }
    setSession(current => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await axiosInstance.get('/admins/me');
      const admin = data?.data?.admin;
      if (!admin?._id || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
        const error = new Error('The server returned an invalid administrator session.');
        error.invalidAdminSession = true;
        throw error;
      }
      setSession({ admin, error: '', loading: false });
      return admin;
    } catch (error) {
      const message = error?.response?.data?.message
        || error?.message
        || 'Could not validate your administrator session.';
      setSession({ admin: null, error: message, loading: false });
      if (
        error?.invalidAdminSession
        || [401, 403, 404].includes(error?.response?.status)
      ) {
        clearAdminSession();
        navigate('/', { replace: true });
      }
      return null;
    }
  }, [navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleClearedSession = () => {
      setSession({ admin: null, error: '', loading: false });
      navigate('/', { replace: true });
    };
    window.addEventListener(ADMIN_SESSION_CLEARED_EVENT, handleClearedSession);
    return () => {
      window.removeEventListener(ADMIN_SESSION_CLEARED_EVENT, handleClearedSession);
    };
  }, [navigate]);

  const value = useMemo(() => ({
    ...session,
    isSuperAdmin: session.admin?.role === 'SUPER_ADMIN',
    refresh,
  }), [refresh, session]);

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export const useAdminSession = () => useContext(AdminSessionContext);
