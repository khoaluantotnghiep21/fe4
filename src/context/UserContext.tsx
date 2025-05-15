'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user.types';
import { logout as apiLogout } from '@/lib/api/authApi';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isUserLoaded: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  const setUser = (user: User | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem('user_information', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_information');
      localStorage.removeItem('access_token');
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user_information');
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user_information');
      }
    }
    setIsUserLoaded(true);
  }, []);

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('access_token');
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, isUserLoaded }}>
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