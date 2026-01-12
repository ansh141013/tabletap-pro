import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// In Firebase, Auth Callback is usually handled automatically by the SDK or standard redirect flow.
// However, if we redirect here manually, we should check auth state.
// Since we used signInWithPopup for Google, this page might not even be hit in the same way Supabase does.
// But if used for email links or similar, we can keep it as a "Loading/Redirecting" state page.

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (userProfile?.restaurantId) {
          navigate('/dashboard'); // Can refine to check setupComplete if available in profile
        } else {
          navigate('/owner-setup');
        }
      } else {
        navigate('/login');
      }
    }
  }, [user, userProfile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
