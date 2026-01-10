import ScrollAnimation, { StaggerContainer, StaggerItem } from "./ScrollAnimation";
import { Star } from "lucide-react";
import testimonialMaria from "@/assets/testimonial-maria.jpg";
import testimonialJames from "@/assets/testimonial-james.jpg";
import testimonialSophie from "@/assets/testimonial-sophie.jpg";

const testimonials = [
  {
    name: "Maria Santos",
    role: "Owner, Casa Verde",
    quote: "TableTap cut our order errors by 90%. The kitchen gets exactly what customers want, and our staff can focus on hospitality instead of running back and forth.",
    rating: 5,
    image: testimonialMaria,
  },
  {
    name: "James Chen",
    role: "Manager, Golden Dragon",
    quote: "Setup took 20 minutes. We were accepting orders the same day. Our customers love ordering from their phones — no waiting for a server.",
    rating: 5,
    image: testimonialJames,
  },
  {
    name: "Sophie Laurent",
    role: "Owner, Le Petit Café",
    quote: "The real-time kitchen updates changed everything. Orders flow smoothly, and we've increased table turnover by 30% without feeling rushed.",
    rating: 5,
    image: testimonialSophie,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              Trusted by Restaurants Everywhere
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See what restaurant owners are saying about TableTap.
            </p>
          </div>
        </ScrollAnimation>

        <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <StaggerItem key={index}>
              <div className="bg-surface rounded-2xl p-8 shadow-soft h-full flex flex-col">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-primary text-primary"
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-foreground text-lg leading-relaxed flex-grow mb-6">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default TestimonialsSection;
