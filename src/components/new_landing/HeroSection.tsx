import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import HeroAnimation from "./HeroAnimation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms
  const textY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const animationY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="pt-24 pb-12 lg:pt-40 lg:pb-24 overflow-hidden relative"
    >
      {/* Background Elements (Parallax kept for bg only) */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-40 -right-32 w-80 h-80 bg-primary/8 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-primary/3 rounded-full blur-2xl opacity-30" />
        <div className="absolute inset-0 opacity-[0.015] grid-pattern" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content - Static Layout */}
          <motion.div
            style={{ opacity }}
            className="max-w-xl mx-auto lg:mx-0 flex flex-col justify-center text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 self-center lg:self-start"
            >
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Restaurant Order Management
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            >
              Run your restaurant orders.{" "}
              <span className="text-muted-foreground block mt-2">Not your customers.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0"
            >
              TableTap gives restaurants full control over orders, tables, and kitchen flow — while customers order instantly without logging in.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link to="/owner-setup">
                <Button variant="landingHero" size="lg" className="gap-2 w-full sm:w-auto">
                  Get Started
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}>
                <Button variant="landingHeroOutline" size="lg" className="gap-2 w-full sm:w-auto">
                  <Play size={18} />
                  See How It Works
                </Button>
              </a>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 pt-8 border-t border-border/50 flex items-center justify-center lg:justify-start gap-8"
            >
              <div className="text-center lg:text-left">
                <p className="text-2xl font-bold text-foreground">500+</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Restaurants</p>
              </div>
              <div className="w-px h-10 bg-border"></div>
              <div className="text-center lg:text-left">
                <p className="text-2xl font-bold text-foreground">2M+</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Orders</p>
              </div>
              <div className="w-px h-10 bg-border"></div>
              <div className="text-center lg:text-left">
                <p className="text-2xl font-bold text-foreground">99.9%</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Uptime</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Animation - Aligned */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-lg mx-auto lg:max-w-none"
          >
            <div className="relative rounded-3xl shadow-2xl bg-background/50 border border-border/50 backdrop-blur-sm">
              <HeroAnimation />
            </div>
            {/* Soft glow behind */}
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-3xl -z-10 opacity-50"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
