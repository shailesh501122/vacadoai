import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { authApi } from '../api/endpoints';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  subscription?: { plan: string; status: string };
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { user } = await authApi.me();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('vacado_token')) refresh();
    else setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await authApi.login({ email, password });
    localStorage.setItem('vacado_token', token);
    setUser(user);
  };

  const register = async (email: string, password: string, name: string) => {
    const { token, user } = await authApi.register({ email, password, name });
    localStorage.setItem('vacado_token', token);
    setUser(user);
  };

  const logout = async () => {
    await authApi.logout().catch(() => undefined);
    localStorage.removeItem('vacado_token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
