import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle, Zap, Smile, TrendingUp } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Instant ordering",
    description: "Customers scan, browse, and order in seconds. No waiting for a waiter.",
  },
  {
    icon: CheckCircle,
    title: "Zero mistakes",
    description: "Digital orders go straight to your kitchen. No miscommunication.",
  },
  {
    icon: Smile,
    title: "Happy customers",
    description: "Faster service, accurate orders, and the ability to order more anytime.",
  },
  {
    icon: TrendingUp,
    title: "More revenue",
    description: "Faster table turns, easier upsells, and higher average order value.",
  },
];

export const SolutionSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-32 bg-gradient-hero" ref={ref}>
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-primary bg-primary/10 rounded-full">
              The Solution
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              TableTap brings{" "}
              <span className="text-gradient">calm to the chaos</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              A complete ordering and management system that works for you, not against you. 
              Your customers order with a simple QR scan—no apps, no accounts needed.
            </p>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-card rounded-2xl border border-border shadow-xl p-6 md:p-8">
              {/* Mock Dashboard Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">Live Orders</h4>
                  <span className="flex items-center gap-2 text-sm text-success">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    Real-time
                  </span>
                </div>

                {/* Order Cards */}
                {[
                  { table: "Table 5", items: "2× Margherita, 1× Tiramisu", status: "Preparing", statusColor: "warning" },
                  { table: "Table 3", items: "1× Caesar Salad, 2× Pasta", status: "Ready", statusColor: "success" },
                  { table: "Table 8", items: "3× Espresso", status: "New", statusColor: "primary" },
                ].map((order, i) => (
                  <motion.div
                    key={order.table}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground">{order.table}</p>
                      <p className="text-sm text-muted-foreground">{order.items}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full bg-${order.statusColor}/10 text-${order.statusColor}`}>
                      {order.status}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
