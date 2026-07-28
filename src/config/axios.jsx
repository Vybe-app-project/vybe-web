import Axios from 'axios';
import { API_BASE_URL, API_CONFIGURATION_ERROR } from './env';
import { clearAdminSession, getAdminToken } from '../utils/adminAuthStorage';

const axiosInstance = Axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 15_000,
});

axiosInstance.interceptors.request.use(
  function (config) {
    if (API_CONFIGURATION_ERROR) {
      return Promise.reject(new Error(API_CONFIGURATION_ERROR));
    }
    if (typeof window !== 'undefined') {
      const token = getAdminToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      clearAdminSession();
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
