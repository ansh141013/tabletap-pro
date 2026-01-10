import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroScene } from "./HeroScene";

export const HeroSection = () => {
  const navigate = useNavigate();

  const handleScrollToDemo = () => {
    const demoSection = document.getElementById("how-it-works");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen pt-16 overflow-hidden bg-gradient-hero">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)] py-12">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-secondary border border-border"
            >
              <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-secondary-foreground">
                Trusted by 500+ restaurants
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            >
              Run your restaurant{" "}
              <span className="text-gradient">without chaos</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Orders, tables, and staff managed in real time. Customers order via QR
              code—no app downloads, no logins needed.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate('/owner-login')}
                className="cursor-pointer transition-transform duration-200 hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                variant="hero-outline"
                size="xl"
                onClick={handleScrollToDemo}
                className="cursor-pointer transition-transform duration-200 hover:scale-105"
              >
                <Play className="h-5 w-5" />
                View Demo
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-12 pt-8 border-t border-border"
            >
              <div className="flex flex-wrap gap-8 justify-center lg:justify-start items-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">15k+</p>
                  <p className="text-sm text-muted-foreground">Orders daily</p>
                </div>
                <div className="h-8 w-px bg-border hidden sm:block" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">99.9%</p>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <div className="h-8 w-px bg-border hidden sm:block" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">4.9★</p>
                  <p className="text-sm text-muted-foreground">App rating</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: 3D Scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative h-[400px] md:h-[500px] lg:h-[600px]"
          >
            <HeroScene />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <a
          href="#problems"
          className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-sm">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-current flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-current rounded-full" />
          </motion.div>
        </a>
      </motion.div>
    </section>
  );
};
