import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User } from '../types';
import { loginUser, registerUser } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithCustomToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('rag_token'));
  const [user, setUser] = useState<User | null>(null);

  const decodeAndSetUser = (jwtToken: string) => {
    try {
      const decoded = jwtDecode<any>(jwtToken);
      const sub = decoded.sub;
      if (!sub) {
        throw new Error('Token does not contain subject (sub) claim');
      }
      setUser({
        sub,
        email: decoded.email,
        name: decoded.email ? decoded.email.split('@')[0] : 'User',
      });
      setToken(jwtToken);
      localStorage.setItem('rag_token', jwtToken);
    } catch (err) {
      console.error('Failed to decode token:', err);
      logout();
    }
  };

  useEffect(() => {
    if (token) {
      decodeAndSetUser(token);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    decodeAndSetUser(res.access_token);
  };

  const register = async (email: string, password: string) => {
    const res = await registerUser(email, password);
    decodeAndSetUser(res.access_token);
  };

  const loginWithCustomToken = (customToken: string) => {
    decodeAndSetUser(customToken.trim());
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rag_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        register,
        loginWithCustomToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
