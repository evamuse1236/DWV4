import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { User, AuthContextType } from "../types";

// Storage key for session token
const TOKEN_KEY = "deep-work-tracker-token";

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider component that wraps the app
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  });

  // Query current user based on token
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    token ? { token } : "skip"
  );

  // Mutations
  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);

  // Determine loading state
  const isLoading = token !== null && currentUser === undefined;

  // Convert user to our User type (or null)
  const user: User | null = currentUser
    ? {
        _id: currentUser._id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        role: currentUser.role,
        avatarUrl: currentUser.avatarUrl,
        batch: currentUser.batch,
        createdAt: currentUser.createdAt,
        lastLoginAt: currentUser.lastLoginAt,
      }
    : null;

  // Clear token if session is invalid
  useEffect(() => {
    if (token && currentUser === null) {
      // Token exists but user is null - session expired or invalid
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, [token, currentUser]);

  /**
   * Login function
   */
  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        const result = await loginMutation({ username, password });

        if (result.success && result.token) {
          localStorage.setItem(TOKEN_KEY, result.token);
          setToken(result.token);
          return true;
        }

        return false;
      } catch (error) {
        console.error("Login error:", error);
        return false;
      }
    },
    [loginMutation]
  );

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      if (token) {
        await logoutMutation({ token });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, [token, logoutMutation]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

/**
 * Hook to get the current session token
 * Useful for making authenticated API calls
 */
export function useSessionToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
  }, []);

  return token;
}

export default useAuth;
