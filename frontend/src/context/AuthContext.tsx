"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

export interface Spreadsheet {
  id: string;
  url: string;
  sheets: string[];
}

interface AuthContextType {
  user: User | null;
  spreadsheet: Spreadsheet | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  forceSync: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [spreadsheet, setSpreadsheet] = useState<Spreadsheet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const login = () => {
    // Redirect browser to backend Google login route
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const logout = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        setUser(null);
        setSpreadsheet(null);
        localStorage.removeItem('token');
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback
      setUser(null);
      setSpreadsheet(null);
      localStorage.removeItem('token');
      router.push('/');
    }
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setSpreadsheet(null);
        setLoading(false);
        return;
      }

      const res = await fetch(`${backendUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setSpreadsheet(data.spreadsheet);
        } else {
          localStorage.removeItem('token');
          setUser(null);
          setSpreadsheet(null);
        }
      } else {
        localStorage.removeItem('token');
        setUser(null);
        setSpreadsheet(null);
      }
    } catch (error) {
      console.error('CheckAuth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceSync = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const res = await fetch(`${backendUrl}/api/auth/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSpreadsheet(data.spreadsheet);
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('ForceSync error:', error);
      return false;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        spreadsheet,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
        forceSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
