import Axios from 'axios';

const axiosInstance = Axios.create({
  baseURL: 'http://localhost:8080/api',
});

axiosInstance.interceptors.request.use(
  async function (config) {
    if (localStorage) {
      const token = localStorage.getItem('access_token');
      config.headers.Authorization = `Bearer ${token}`;
      config.timeout = 300000;
      console.log("config.headers",config.headers)
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

export default axiosInstance;
