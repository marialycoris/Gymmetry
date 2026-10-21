import { createContext, useContext, useState, type ReactNode } from 'react';

// Shape of the login response from your Spring Boot API.
export interface User {
  username: string;
  role: 'ADMIN' | 'TRAINER' | 'MEMBER';
  personId: number; // memberId or trainerId depending on role
  name: string;
  mustChangePassword?: boolean; // true until the first-login password change is done
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Check local storage on load so the user stays logged in on refresh
    const saved = localStorage.getItem('gymmetry_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('gymmetry_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gymmetry_user');
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}