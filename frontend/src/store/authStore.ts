import { create } from 'zustand';
import { AuthTokens, User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('stride_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();
const hasToken = !!localStorage.getItem('stride_access_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: hasToken && !!initialUser,
  isAdmin: initialUser?.role?.name === 'admin',

  setAuth: (user: User, tokens: AuthTokens) => {
    localStorage.setItem('stride_access_token', tokens.access_token);
    localStorage.setItem('stride_refresh_token', tokens.refresh_token);
    localStorage.setItem('stride_user', JSON.stringify(user));
    set({
      user,
      isAuthenticated: true,
      isAdmin: user.role?.name === 'admin',
    });
  },

  updateUser: (user: User) => {
    localStorage.setItem('stride_user', JSON.stringify(user));
    set({
      user,
      isAdmin: user.role?.name === 'admin',
    });
  },

  logout: () => {
    localStorage.removeItem('stride_access_token');
    localStorage.removeItem('stride_refresh_token');
    localStorage.removeItem('stride_user');
    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    });
  },
}));
