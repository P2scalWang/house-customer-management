import { useCallback, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // Always bypass authentication - no server calls needed
  const mockUser = {
    id: 1,
    name: "Demo User",
    email: "demo@example.com",
    openId: "demo-user-001"
  };

  const logout = useCallback(async () => {
    // Simple logout - just redirect to login
    window.location.href = "/login";
  }, []);

  const state = useMemo(() => {
    // Always authenticated with mock user
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(mockUser)
    );
    return {
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
    };
  }, []);

  // Never redirect since always authenticated
  return {
    ...state,
    refresh: () => Promise.resolve(),
    logout,
  };
}
