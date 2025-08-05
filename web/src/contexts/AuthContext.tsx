import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '@/services/api';

interface User {
  id?: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive?: boolean;
  emailConfirmed?: boolean;
  lastLoginAt?: string;
  provider?: string;
  providerId?: string;
  roleId?: number;
  roleName?: string;
  createdAt?: string;
  modifiedAt?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      if (apiService.isAuthenticated()) {
        // In a real app, you might want to validate the token with the server
        // For now, we'll assume the token is valid if it exists
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiService.login({ username, password });

      // Use the user data from the response if available, otherwise create default
      const userData: User = {
        id: response.user?.id,
        username: response.user?.username || '',
        email: response.user?.email ,
        firstName: response.user?.firstName,
        lastName: response.user?.lastName,
        avatar: response.user?.avatar,
        isActive: response.user?.isActive,
        emailConfirmed: response.user?.emailConfirmed,
        lastLoginAt: response.user?.lastLoginAt,
        provider: response.user?.provider,
        providerId: response.user?.providerId,
        roleId: response.user?.roleId,
        roleName: response.user?.roleName || 'user',
        createdAt: response.user?.createdAt,
        modifiedAt: response.user?.modifiedAt,
        permissions: response.user?.permissions || ['read', 'write']
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return user?.roleName === role || false;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};