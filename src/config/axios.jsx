import Axios from 'axios';

const axiosInstance = Axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8081/api',
});

axiosInstance.interceptors.request.use(
  async function (config) {
    if (localStorage) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.timeout = 300000;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

export default axiosInstance;
