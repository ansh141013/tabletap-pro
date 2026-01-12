import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import tabletapLogo from "@/assets/tabletap-logo.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <img src={tabletapLogo} alt="TableTap" className="h-12 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Features</a>
            <a href="#solutions" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Solutions</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">How it Works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Pricing</a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Contact</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/owner-login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link to="/owner-setup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[81px] z-40 flex flex-col">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <div className="relative w-full bg-background border-y border-border/50 p-6 shadow-xl animate-in slide-in-from-top-2 fade-in-20">
              <div className="flex flex-col gap-6 text-center">
                <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-muted-foreground hover:text-foreground py-2">Features</a>
                <a href="#solutions" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-muted-foreground hover:text-foreground py-2">Solutions</a>
                <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-muted-foreground hover:text-foreground py-2">How it Works</a>
                <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-muted-foreground hover:text-foreground py-2">Pricing</a>
                <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-muted-foreground hover:text-foreground py-2">Contact</a>
                <div className="flex flex-col gap-3 pt-6 border-t border-border/50 mt-2">
                  <Link to="/owner-login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="lg" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/owner-setup" onClick={() => setIsMenuOpen(false)}>
                    <Button size="lg" className="w-full shadow-lg hover:shadow-xl transition-all">Get Started</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
