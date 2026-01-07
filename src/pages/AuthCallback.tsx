import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        navigate('/login');
        return;
      }

      if (session?.user) {
        // Create profile if it doesn't exist
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            user_id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            email: session.user.email,
          });
        }

        // Check if setup is complete
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('setup_complete')
          .eq('owner_id', session.user.id)
          .single();

        if (restaurant?.setup_complete) {
          navigate('/dashboard');
        } else {
          navigate('/owner-setup');
        }
      } else {
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

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
