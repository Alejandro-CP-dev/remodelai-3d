import { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';

// Application-layer wrapper around the auth-related StorageService calls.
// Owns the currentUser React state for whichever component consumes it;
// cross-component orchestration (navigation, syncing other hooks) stays in
// the caller via the same onAuthSuccess-style callbacks used before.
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());

  const login = (email: string): User => {
    const user = StorageService.login(email);
    setCurrentUser(user);
    return user;
  };

  const register = (name: string, email: string) => StorageService.registerUser(name, email);

  const verifyEmail = (userId: string): User => {
    const user = StorageService.verifyEmail(userId);
    setCurrentUser(user);
    return user;
  };

  const updateProfile = (userId: string, updates: { name?: string; email?: string; avatarUrl?: string }): User => {
    const user = StorageService.updateUserProfile(userId, updates);
    if (currentUser?.id === userId) {
      setCurrentUser(user);
    }
    return user;
  };

  const setUserStatus = (userId: string, status: 'ACTIVE' | 'INACTIVE'): User => {
    const user = StorageService.setUserStatus(userId, status, currentUser);
    if (currentUser?.id === userId && status === 'INACTIVE') {
      setCurrentUser(null);
    }
    return user;
  };

  const loginWithGoogle = (): User => {
    const user = StorageService.loginWithGoogle();
    setCurrentUser(user);
    return user;
  };

  const logout = (): void => {
    StorageService.logout();
    setCurrentUser(null);
  };

  const getUsers = () => StorageService.getUsers();

  return { currentUser, setCurrentUser, login, register, verifyEmail, loginWithGoogle, logout, getUsers, updateProfile, setUserStatus };
}
