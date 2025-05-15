'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user.types';
import { logout as apiLogout, getUserRole } from '@/lib/api/authApi';
import Cookies from 'js-cookie';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isUserLoaded: boolean;
  hasRole: (role: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  const setUser = (user: User | null) => {
    setUserState(user);
    if (user) {
      // Store user info in both localStorage and cookies for middleware access
      localStorage.setItem('user_information', JSON.stringify(user));
      Cookies.set('user_information', JSON.stringify(user), { path: '/' });

      // Store access token in both localStorage and cookies
      const token = localStorage.getItem('access_token');
      if (token) {
        Cookies.set('access_token', token, { path: '/' });
      }
    } else {
      localStorage.removeItem('user_information');
      localStorage.removeItem('access_token');
      Cookies.remove('user_information', { path: '/' });
      Cookies.remove('access_token', { path: '/' });
    }
  };

  // Function to check if user has a specific role
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles?.includes(role) || false;
  };

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user_information');
      const token = localStorage.getItem('access_token');

      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);

          // Ensure cookies are set for middleware
          Cookies.set('user_information', storedUser, { path: '/' });
          Cookies.set('access_token', token, { path: '/' });

          // Get latest role information
          if (userData.id) {
            const userRole = await getUserRole(userData.id);
            if (userRole?.roles) {
              userData.roles = userRole.roles;
            }
          }

          setUserState(userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('user_information');
          Cookies.remove('user_information', { path: '/' });
        }
      }
      setIsUserLoaded(true);
    };

    loadUser();
  }, []);

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, isUserLoaded, hasRole }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};