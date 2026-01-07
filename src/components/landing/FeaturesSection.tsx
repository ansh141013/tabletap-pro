import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  QrCode,
  LayoutDashboard,
  Bell,
  Clock,
  Shield,
  Smartphone,
  BarChart3,
  Users,
  Zap,
  Globe,
  Palette,
  HeadphonesIcon,
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "QR Code Ordering",
    description: "Unique QR codes for each table. Customers scan and order instantly—no downloads required.",
    highlight: true,
  },
  {
    icon: LayoutDashboard,
    title: "Real-time Dashboard",
    description: "See all orders, tables, and staff activity in one beautiful, real-time interface.",
    highlight: true,
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description: "Get alerted immediately when new orders come in or customers need assistance.",
  },
  {
    icon: Clock,
    title: "Table Management",
    description: "Track table status, manage reservations, and optimize seating automatically.",
  },
  {
    icon: Shield,
    title: "Abuse Prevention",
    description: "Built-in protection against fake orders with smart verification when needed.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Menu",
    description: "Beautiful, fast-loading menu that works perfectly on any device.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Understand your bestsellers, peak hours, and customer preferences.",
  },
  {
    icon: Users,
    title: "Staff Management",
    description: "Assign roles, track performance, and coordinate your team effortlessly.",
  },
  {
    icon: Zap,
    title: "Fast Setup",
    description: "Get started in minutes. Add your menu, print QR codes, and you're ready to go.",
  },
  {
    icon: Globe,
    title: "Multi-language",
    description: "Serve international customers with automatic menu translation.",
  },
  {
    icon: Palette,
    title: "Customizable",
    description: "Match your brand with custom colors, logo, and menu styling.",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Our team is always here to help you succeed with TableTap.",
  },
];

export const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-20 md:py-32 bg-secondary/30" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-primary bg-primary/10 rounded-full">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need to run a modern restaurant
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed specifically for restaurant owners. Simple enough to use from day one.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`group p-6 bg-card rounded-xl border transition-all duration-300 card-hover ${
                feature.highlight 
                  ? "border-primary/30 shadow-md" 
                  : "border-border hover:border-primary/20"
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg mb-4 transition-transform group-hover:scale-110 ${
                feature.highlight
                  ? "bg-gradient-warm text-primary-foreground"
                  : "bg-primary/10 text-primary"
              }`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
