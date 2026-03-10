import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ========================================
// TYPES
// ========================================
export type UserRole = "admin" | "scout" | "gestor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubName: string;
  clubLogo?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
}

// ========================================
// CONTEXT
// ========================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export context for optional usage
export { AuthContext };

// ========================================
// MOCK DATA
// ========================================
const MOCK_USERS = [
  {
    id: "1",
    email: "soccermind@adm.com.br",
    password: "123Senha",
    name: "Ricardo Santos",
    role: "admin" as UserRole,
    clubName: "Sport Club Corinthians",
  },
  {
    id: "2",
    email: "admin@corinthians.com.br",
    password: "admin123",
    name: "Ricardo Santos",
    role: "admin" as UserRole,
    clubName: "Sport Club Corinthians",
  },
  {
    id: "3",
    email: "scout@corinthians.com.br",
    password: "scout123",
    name: "Maria Oliveira",
    role: "scout" as UserRole,
    clubName: "Sport Club Corinthians",
  },
  {
    id: "4",
    email: "gestor@corinthians.com.br",
    password: "gestor123",
    name: "João Silva",
    role: "gestor" as UserRole,
    clubName: "Sport Club Corinthians",
  },
];

// ========================================
// PROVIDER
// ========================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("soccermind_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("soccermind_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Find user
    const foundUser = MOCK_USERS.find((u) => u.email === email && u.password === password);

    if (!foundUser) {
      setIsLoading(false);
      throw new Error("Email ou senha inválidos");
    }

    // Create user object (without password)
    const userToStore: User = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      clubName: foundUser.clubName,
    };

    setUser(userToStore);
    localStorage.setItem("soccermind_user", JSON.stringify(userToStore));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("soccermind_user");
  };

  const resetPassword = async (email: string): Promise<void> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Check if user exists
    const userExists = MOCK_USERS.find((u) => u.email === email);

    if (!userExists) {
      throw new Error("Email não encontrado");
    }

    // In production, this would send an email
    console.log(`Password reset email sent to ${email}`);
  };

  const updatePassword = async (token: string, newPassword: string): Promise<void> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, this would validate token and update password
    console.log(`Password updated with token ${token}`);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ========================================
// HOOK
// ========================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ========================================
// PERMISSIONS
// ========================================
export const ROLE_PERMISSIONS = {
  admin: {
    canAccessAll: true,
    canEditPlayers: true,
    canViewReports: true,
    canManageGovernance: true,
    canManageUsers: true,
  },
  gestor: {
    canAccessAll: true,
    canEditPlayers: true,
    canViewReports: true,
    canManageGovernance: true,
    canManageUsers: false,
  },
  scout: {
    canAccessAll: false,
    canEditPlayers: false,
    canViewReports: true,
    canManageGovernance: false,
    canManageUsers: false,
  },
};

export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS.admin): boolean {
  return ROLE_PERMISSIONS[role][permission] || false;
}