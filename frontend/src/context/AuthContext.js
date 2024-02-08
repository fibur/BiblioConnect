import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from '../utils/axiosConfig';
import eventEmitter from '../utils/eventEmitter';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const handleUnauthorized = () => {
    logout();
  };

  useEffect(() => {
    const username = Cookies.get('username');
    if (username) {
      setCurrentUser(username);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('login', { username, password });
      if (response.data && response.data.access_token) {
        Cookies.set('access_token', response.data.access_token, { expires: 1 });
        Cookies.set('username', username, { expires: 1 });
        setCurrentUser(username);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
      Cookies.remove('access_token');
      Cookies.remove('username');
      setCurrentUser(null);
      navigate('/');
  };

  const register = async (username, email, password) => {
    const response = await axios.post('register', { username, email, password });
    return response;
  }

  const authorize = async () => {
    try {
      const response = await axios.get('/authorize');
      if (response.data && response.data.username) {
        Cookies.set('username', response.data.username, { expires: 1 });
        const currentAccessToken = Cookies.get('access_token');
        if (currentAccessToken) {
          Cookies.set('access_token', currentAccessToken, { expires: 1 });
        }
        setCurrentUser(response.data.username);
      }

      return response;
    } catch (error) {
      console.error('Authorize error:', error);
      throw error;
    }
  };

  const authContextValue = {
    currentUser,
    login,
    logout,
    register,
    authorize
  };

  eventEmitter.subscribe('unauthorized', handleUnauthorized);

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};
