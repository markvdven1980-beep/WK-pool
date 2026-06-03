import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from './api';
import type { User } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, name: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('wk-token');
    if (token) {
      api.auth.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('wk-token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const { token, user } = await api.auth.login(username, password);
    localStorage.setItem('wk-token', token);
    setUser(user);
  };

  // Geeft het eenmalig gegenereerde wachtwoord terug aan de LoginPage.
  const register = async (username: string, name: string): Promise<string> => {
    const { token, user, generatedPassword } = await api.auth.register({ username, name });
    localStorage.setItem('wk-token', token);
    setUser(user);
    return generatedPassword;
  };

  const logout = () => {
    localStorage.removeItem('wk-token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
