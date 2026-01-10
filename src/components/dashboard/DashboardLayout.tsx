import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  ClipboardList,
  Grid3X3,
  MenuSquare,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWaiterCalls } from "@/hooks/useWaiterCalls";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: ClipboardList, label: "Orders", href: "/dashboard" },
  { icon: MenuSquare, label: "Menu", href: "/dashboard/menu" },
  { icon: Grid3X3, label: "Tables", href: "/dashboard/tables" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [restaurant, setRestaurant] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const { waiterCalls } = useWaiterCalls();

  const pendingCalls = waiterCalls.filter(call => call.status === 'pending').length;

  const { session, loading } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return;

      // Dev mode bypass - check if coming from dev skip
      const isDevMode = sessionStorage.getItem('devMode') === 'true';

      if (!session && !isDevMode) {
        navigate('/login');
        return;
      }

      if (session) {
        setUserEmail(session.user.email || "");

        // Get restaurant info
        const { data: restaurantData } = await supabase
          .from('restaurants')
          .select('name, logo_url')
          .eq('owner_id', session.user.id)
          .single();

        if (restaurantData) {
          setRestaurant(restaurantData);
        }
      } else if (isDevMode) {
        setUserEmail("dev@demo.com");
        setRestaurant({ name: "Demo Restaurant", logo_url: null });
      }
    };

    checkAuth();
  }, [session, loading, navigate]);

  const getPageTitle = () => {
    const item = navItems.find((item) => item.href === location.pathname);
    return item?.label || "Orders";
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    // Clear local storage
    localStorage.clear();

    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      setIsLoggingOut(false);
      return;
    }

    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });

    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-warm shadow-md">
                <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-sidebar-foreground">TableTap</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="lg:hidden p-1 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href === "/dashboard" && location.pathname === "/dashboard");
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-3">
              {restaurant?.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt="Restaurant logo"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-warm flex items-center justify-center text-primary-foreground font-semibold">
                  {restaurant?.name?.[0] || "R"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {restaurant?.name || "Your Restaurant"}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {userEmail}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">{getPageTitle()}</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Link
                to="/dashboard/calls"
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bell className="h-5 w-5" />
                {pendingCalls > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {pendingCalls}
                  </Badge>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to log in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing out...
                </>
              ) : (
                "Sign out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
