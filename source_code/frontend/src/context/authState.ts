import { createContext } from 'react';

export interface User {
  username: string;
  role: 'ADMIN' | 'TRAINER' | 'MEMBER';
  personId: number;
  name: string;
  mustChangePassword?: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
