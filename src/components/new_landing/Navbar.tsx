import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import tabletapLogo from "@/assets/tabletap-logo.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container-max section-padding py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <img src={tabletapLogo} alt="TableTap" className="h-16 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">How it Works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Pricing</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/owner-login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/owner-setup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[88px] bg-background border-t p-6 animate-in slide-in-from-top-5 fade-in-20 z-40">
            <div className="flex flex-col gap-6 text-center">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Features</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">How it Works</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Pricing</a>
              <div className="flex flex-col gap-3 pt-6 border-t mt-2">
                <Link to="/owner-login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" size="lg" className="w-full">Sign In</Button>
                </Link>
                <Link to="/owner-setup" onClick={() => setIsMenuOpen(false)}>
                  <Button size="lg" className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
