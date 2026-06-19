import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { setUser } = useAuth(); 

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      
      api.get('/auth/current-user')
        .then(res => {
          setUser(res.data);
          navigate('/dashboard');
        })
        .catch(err => {
          console.error('Failed to fetch user:', err);
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [location, navigate, setUser]);

  return (
    <div className="app-loading">
      <div className="spinner" />
      <p>Authenticating...</p>
    </div>
  );
};

export default AuthSuccess;