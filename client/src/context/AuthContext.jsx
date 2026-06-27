import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ss_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists, verify or load user
    if (token) {
      // In a full production app we could call GET /api/auth/me,
      // here we decode token or extract mock email
      try {
        // Decode token to extract email (or simple mock decode)
        const savedEmail = localStorage.getItem('ss_user_email') || 'user@example.com';
        setUser({ email: savedEmail });
      } catch (err) {
        console.error("Token restore error:", err);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to login');
    }

    const sessionToken = data.session?.access_token || 'mock-access-token-jwt';
    localStorage.setItem('ss_token', sessionToken);
    localStorage.setItem('ss_user_email', email);
    setToken(sessionToken);
    setUser({ email });
    return data;
  };

  const signup = async (email, password) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign up');
    }
    return data;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn("Server logout call failed, cleaning up client session anyway.");
    }
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user_email');
    setToken(null);
    setUser(null);
  };

  // Helper fetch function that automatically injects auth header
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      logout();
    }

    return response;
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    authFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
