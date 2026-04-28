import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: "admin" | "employee" | "client";
  phone?: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("salon_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem("salon_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("salon_user");
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
