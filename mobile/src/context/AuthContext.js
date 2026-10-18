import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, TOKEN_KEY } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY);
        if (saved) {
          setToken(saved);
          const me = await api.get('/users/me');
          setUser(me);
        }
      } catch (err) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const saveSession = useCallback(async (payload) => {
    await AsyncStorage.setItem(TOKEN_KEY, payload.token);
    setToken(payload.token);
    setUser(payload.user);
  }, []);

  const signIn = useCallback(
    async (email, password) => {
      const data = await api.post('/auth/login', { email, password });
      await saveSession(data);
    },
    [saveSession]
  );

  const signUp = useCallback(
    async (name, email, password) => {
      const data = await api.post('/auth/register', { name, email, password });
      await saveSession(data);
    },
    [saveSession]
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (fields) => {
    const updated = await api.put('/users/me', fields);
    setUser(updated);
    return updated;
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.del('/users/me');
    await signOut();
  }, [signOut]);

  const refreshUser = useCallback(async () => {
    const me = await api.get('/users/me');
    setUser(me);
    return me;
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, initializing, signIn, signUp, signOut, updateProfile, deleteAccount, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
