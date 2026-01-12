import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Import Pages
import Index from "./pages/Index";
import GuestMenu from "./pages/GuestMenu"; // Keeping existing GuestMenu as it might be used
import { CustomerMenu } from "./pages/CustomerMenu"; // New one requested
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";
import OwnerSetup from "./pages/OwnerSetup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner position="bottom-right" richColors />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/owner-login" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/owner-signup" element={<Signup />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Menu Routes */}
            <Route path="/menu" element={<CustomerMenu />} />
            <Route path="/menu/:restaurantId" element={<GuestMenu />} />
            <Route path="/menu/:restaurantId/cart" element={<CartPage />} />
            <Route path="/cart" element={<CartPage />} /> {/* Added for generic cart access if needed */}
            <Route path="/checkout/:restaurantId" element={<CheckoutPage />} />

            {/* Protected Routes */}
            <Route
              path="/owner-setup"
              element={
                <ProtectedRoute>
                  <OwnerSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
