import axios from 'axios';
import Cookies from 'js-cookie';
import eventEmitter from './eventEmitter';

const instance = axios.create({
  baseURL: 'http://localhost:5000/',
});

instance.interceptors.request.use(config => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(response => response, error => {
  if (error.response && error.response.status === 401) {
    eventEmitter.emit('unauthorized');
  }
  return Promise.reject(error);
});

export default instance;
