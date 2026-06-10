import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AuthSuccess = ({ setUser }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      api.get('/auth/current-user', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setUser(res.data);
          navigate('/dashboard');
        })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, [navigate, setUser]);

  return (
    <div className="app-loading">
      <div className="spinner" />
      <p>Signing you in...</p>
    </div>
  );
};

export default AuthSuccess;
