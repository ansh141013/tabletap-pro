// Re-export from context to maintain compatibility if other files import from here
// But ideally, files should import from contexts/AuthContext directly
import { useAuth as useContextAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const { user, loading, logout } = useContextAuth();
  // Map to similar interface if needed, or just return context values
  return {
    session: user ? { user } : null, // Mock session object if really needed, else just user
    user,
    loading,
    signOut: logout
  };
};

export const useRequireAuth = (redirectTo: string = '/login') => {
  const { user, loading } = useContextAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate(redirectTo);
    }
  }, [loading, user, navigate, redirectTo]);

  return { session: user ? { user } : null, user, loading };
};
