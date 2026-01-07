import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Clock, PhoneOff, Users, AlertTriangle, DollarSign, Frown } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Orders get lost",
    description: "Handwritten tickets, shouted orders, and miscommunication lead to wrong dishes and angry customers.",
  },
  {
    icon: PhoneOff,
    title: "Staff overwhelmed",
    description: "Waiters running between tables, phone ringing, delivery apps buzzing—chaos during peak hours.",
  },
  {
    icon: Users,
    title: "Long wait times",
    description: "Customers waiting to order, waiting for the check, waiting for attention. Frustration builds.",
  },
  {
    icon: AlertTriangle,
    title: "No visibility",
    description: "No idea which tables need attention, which orders are delayed, or how your restaurant is performing.",
  },
  {
    icon: DollarSign,
    title: "Lost revenue",
    description: "Customers leave without ordering dessert. Tables turn slowly. Upselling opportunities missed.",
  },
  {
    icon: Frown,
    title: "Bad reviews",
    description: "One bad experience leads to negative reviews that hurt your reputation for years.",
  },
];

export const ProblemsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="problems" className="py-20 md:py-32 bg-secondary/30" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-primary bg-primary/10 rounded-full">
            The Problem
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Running a restaurant shouldn't feel like this
          </h2>
          <p className="text-lg text-muted-foreground">
            Every day, restaurant owners battle the same frustrations. Sound familiar?
          </p>
        </motion.div>

        {/* Problems Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 bg-card rounded-xl border border-border hover:border-destructive/30 hover:bg-destructive/5 transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive mb-4 group-hover:scale-110 transition-transform">
                <problem.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {problem.title}
              </h3>
              <p className="text-muted-foreground">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
