import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { QrCode, Smartphone, ChefHat, Bell, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: QrCode,
    title: "Scan the QR code",
    description: "Each table has a unique QR code. Customers scan it with their phone camera—no app needed.",
    visual: "qr",
  },
  {
    icon: Smartphone,
    title: "Browse & order",
    description: "Beautiful menu with photos, descriptions, and prices. Add items to cart and checkout instantly.",
    visual: "phone",
  },
  {
    icon: ChefHat,
    title: "Kitchen receives order",
    description: "Order appears on your dashboard in real-time. Kitchen staff sees exactly what to prepare.",
    visual: "kitchen",
  },
  {
    icon: Bell,
    title: "Serve & delight",
    description: "Mark orders as ready. Track table status. Keep customers happy with fast, accurate service.",
    visual: "serve",
  },
];

export const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-card" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-primary bg-primary/10 rounded-full">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            From scan to serve in minutes
          </h2>
          <p className="text-lg text-muted-foreground">
            A seamless flow that makes ordering effortless for customers and management simple for you.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {/* Step Number */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-warm text-primary-foreground shadow-lg shadow-glow mb-6">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-card border-2 border-primary text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for mobile/tablet */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex lg:hidden absolute -bottom-4 left-1/2 -translate-x-1/2 text-muted-foreground">
                    <ArrowRight className="h-5 w-5 rotate-90" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Ready to transform your restaurant?
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Start your free trial
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
