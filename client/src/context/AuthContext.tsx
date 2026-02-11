import { createContext } from "react";

export interface User {
  id: string;
  username: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

// We only export the "box" here
export const AuthContext = createContext<AuthContextType | null>(null);
