import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 1. Initialize state directly from storage
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Since state is initialized immediately, we can start with loading as false
  const [isLoading, setIsLoading] = useState(false);

  /// Example of using setIsLoading for a "Verify Token" check
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        setIsLoading(true); // Now the variable is used
        try {
          // You could call an endpoint like /auth/me here to verify the token
          // await api.get('/auth/verify');
        } catch {
          logout();
        } finally {
          setIsLoading(false);
        }
      }
    };
    verifySession();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
