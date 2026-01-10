import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sections = [
  "hero",
  "problems",
  "solution",
  "how-it-works",
  "comparison",
  "integrations",
  "pricing",
  "testimonials",
  "faq",
  "contact",
];

const ScrollButton = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      // Check if at bottom
      const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      setIsAtBottom(isBottom);

      // Find current section
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setCurrentIndex(i);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = () => {
    if (isAtBottom) {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentIndex(0);
    } else {
      // Scroll to next section
      const nextIndex = Math.min(currentIndex + 1, sections.length - 1);
      const element = document.getElementById(sections[nextIndex]);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={scrollToSection}
      className="fixed bottom-8 right-8 z-40 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      aria-label={isAtBottom ? "Scroll to top" : "Scroll to next section"}
    >
      <AnimatePresence mode="wait">
        {isAtBottom ? (
          <motion.div
            key="up"
            initial={{ rotate: 180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -180, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp size={24} />
          </motion.div>
        ) : (
          <motion.div
            key="down"
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="animate-bounce"
          >
            <ChevronDown size={24} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default ScrollButton;
