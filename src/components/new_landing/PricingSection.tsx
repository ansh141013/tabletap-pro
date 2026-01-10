import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import ScrollAnimation, { StaggerContainer, StaggerItem } from "./ScrollAnimation";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for small cafes and food trucks",
    features: [
      "Unlimited orders",
      "Up to 10 tables",
      "Basic dashboard",
      "Email support",
      "Works on any device",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "$79",
    period: "/month",
    description: "For busy restaurants ready to scale",
    features: [
      "Unlimited orders",
      "Unlimited tables",
      "Advanced analytics",
      "Priority support",
      "Kitchen display system",
      "No commission fees",
      "Custom branding",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For restaurant chains and franchises",
    features: [
      "Everything in Pro",
      "Multi-location support",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="bg-surface">
      <div className="container-max section-padding">
        <ScrollAnimation className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary mb-4 block">Pricing</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground">
            No hidden fees. No commission per order. Just one flat monthly price.
          </p>
        </ScrollAnimation>

        <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" staggerDelay={0.15}>
          {plans.map((plan, index) => (
            <StaggerItem key={index}>
              <div
                className={`relative bg-background rounded-3xl p-8 border transition-all duration-300 hover:shadow-soft h-full ${plan.popular
                  ? "border-primary shadow-soft scale-105"
                  : "border-border/50 hover:-translate-y-1"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {plan.name === "Enterprise" ? (
                    <a href="#contact" className="w-full block">
                      <Button
                        variant="landingHeroOutline"
                        className="w-full"
                        size="lg"
                      >
                        Contact Sales
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </a>
                  ) : (
                    <Link to="/owner-setup" className="w-full block">
                      <Button
                        variant={plan.popular ? "landingHero" : "landingHeroOutline"}
                        className="w-full"
                        size="lg"
                      >
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default PricingSection;
