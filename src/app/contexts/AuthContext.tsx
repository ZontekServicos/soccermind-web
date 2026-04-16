import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// ========================================
// TYPES — interface pública preservada para não quebrar consumidores
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
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
}

// ========================================
// CONTEXT
// ========================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export { AuthContext };

// ========================================
// MAPPER: Supabase User → User interno
// ========================================
function mapSupabaseUser(supaUser: SupabaseUser): User {
  const meta = supaUser.user_metadata ?? {};
  return {
    id: supaUser.id,
    name: meta.name ?? meta.full_name ?? supaUser.email?.split("@")[0] ?? "Usuário",
    email: supaUser.email ?? "",
    // role deve ser salvo em user_metadata ao criar o usuário no Supabase
    role: (meta.role as UserRole) ?? "scout",
    clubName: meta.clubName ?? meta.club_name ?? "SoccerMind",
    clubLogo: meta.clubLogo ?? meta.club_logo,
  };
}

// ========================================
// PROVIDER
// ========================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Remove dados do mock auth anterior (migração para Supabase)
    localStorage.removeItem("soccermind_user");

    // Lê sessão existente (localStorage/cookie gerenciado pelo Supabase)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ? mapSupabaseUser(s.user) : null);
      setIsLoading(false);
    });

    // Reage a login, logout, refresh de token
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ? mapSupabaseUser(s.user) : null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string): Promise<void> => {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);
  };

  // O parâmetro token não é mais necessário — o Supabase estabelece a sessão
  // automaticamente a partir do hash da URL do link de recuperação.
  const updatePassword = async (_token: string, newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    session,
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
// PERMISSIONS — preservadas sem alteração
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

export function hasPermission(
  role: UserRole,
  permission: keyof typeof ROLE_PERMISSIONS.admin,
): boolean {
  return ROLE_PERMISSIONS[role][permission] || false;
}
