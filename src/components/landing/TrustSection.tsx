import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "TableTap cut our order errors by 90% and our customers love the easy ordering. Best decision we made this year.",
    author: "Maria Santos",
    role: "Owner, Bella Italia Restaurant",
    rating: 5,
  },
  {
    quote: "The real-time dashboard is a game-changer. I can see everything happening in my restaurant from anywhere.",
    author: "James Chen",
    role: "Manager, The Golden Dragon",
    rating: 5,
  },
  {
    quote: "Setup took 30 minutes. Our average order value increased 25% because customers can easily add items.",
    author: "Sophie Martin",
    role: "Owner, Café Parisien",
    rating: 5,
  },
];

const stats = [
  { value: "500+", label: "Restaurants" },
  { value: "2M+", label: "Orders Processed" },
  { value: "25%", label: "Avg. Revenue Increase" },
  { value: "4.9/5", label: "Customer Rating" },
];

export const TrustSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-32 bg-gradient-hero" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium text-primary bg-primary/10 rounded-full">
            Trusted by Restaurants
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Join hundreds of happy restaurant owners
          </h2>
          <p className="text-lg text-muted-foreground">
            See why restaurants around the world choose TableTap to streamline their operations.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center p-6 bg-card rounded-xl border border-border"
            >
              <p className="text-3xl md:text-4xl font-bold text-gradient mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="relative p-6 bg-card rounded-xl border border-border card-hover"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/10" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6 relative z-10">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-warm flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
