import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from './api';
import type { User } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  // register geeft het wachtwoord terug maar logt nog NIET in.
  // Pas na confirmLogin (na "Doorgaan"-klik) wordt de gebruiker ingelogd.
  register: (username: string, name: string) => Promise<string>;
  confirmLogin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Bewaar token + user tijdelijk tot de gebruiker op "Doorgaan" klikt.
  const [pendingAuth, setPendingAuth] = useState<{ token: string; user: User } | null>(null);

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

  const register = async (username: string, name: string): Promise<string> => {
    const { token, user, generatedPassword } = await api.auth.register({ username, name });
    // Sla token + user op, maar log nog NIET in zodat het wachtwoord getoond kan worden.
    setPendingAuth({ token, user });
    return generatedPassword;
  };

  // Wordt aangeroepen als de gebruiker op "Doorgaan" klikt na het zien van het wachtwoord.
  const confirmLogin = () => {
    if (pendingAuth) {
      localStorage.setItem('wk-token', pendingAuth.token);
      setUser(pendingAuth.user);
      setPendingAuth(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('wk-token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, confirmLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
