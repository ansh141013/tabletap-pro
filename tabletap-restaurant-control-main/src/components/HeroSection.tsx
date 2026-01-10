import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import HeroAnimation from "./HeroAnimation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

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
      className="pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden relative"
    >
      {/* Parallax Background Elements */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {/* Gradient orbs */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-32 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-primary/3 rounded-full blur-2xl" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </motion.div>

      <div className="container-max section-padding py-0 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content with parallax */}
          <motion.div 
            style={{ y: textY, opacity }}
            className="max-w-xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
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
              <span className="text-muted-foreground">Not your customers.</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground leading-relaxed mb-8"
            >
              TableTap gives restaurants full control over orders, tables, and kitchen flow — while customers order instantly without logging in.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button variant="hero" size="lg" className="gap-2">
                Get Started
                <ArrowRight size={18} />
              </Button>
              <Button variant="heroOutline" size="lg" className="gap-2">
                <Play size={18} />
                See How It Works
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 pt-8 border-t border-border/50"
            >
              <p className="text-sm text-muted-foreground mb-4">Trusted by restaurants worldwide</p>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-2xl font-bold text-foreground">500+</p>
                  <p className="text-xs text-muted-foreground">Restaurants</p>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">2M+</p>
                  <p className="text-xs text-muted-foreground">Orders Processed</p>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">99.9%</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Animation with deeper parallax */}
          <motion.div
            style={{ y: animationY }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative lg:pl-8"
          >
            <HeroAnimation />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
