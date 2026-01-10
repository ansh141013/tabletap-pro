import { LayoutDashboard, Table, Bell } from "lucide-react";
import ScrollAnimation, { StaggerContainer, StaggerItem } from "./ScrollAnimation";

const solutions = [
  {
    icon: LayoutDashboard,
    title: "Live Order Management",
    description: "See every order as it comes in. Track status from new to served in real-time.",
  },
  {
    icon: Table,
    title: "Table-Based Tracking",
    description: "Know exactly which table ordered what. Never mix up orders again.",
  },
  {
    icon: Bell,
    title: "Real-Time Kitchen Updates",
    description: "Kitchen staff see orders instantly. No more running back and forth.",
  },
];

const SolutionSection = () => {
  return (
    <section id="features" className="bg-background">
      <div className="container-max section-padding">
        <ScrollAnimation className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary mb-4 block">The Solution</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything you need, nothing you don't
          </h2>
          <p className="text-muted-foreground">
            TableTap simplifies your entire order flow with three powerful features.
          </p>
        </ScrollAnimation>

        <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.15}>
          {solutions.map((solution, index) => (
            <StaggerItem key={index}>
              <div className="group relative bg-surface rounded-3xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-soft h-full">
                {/* Icon Container */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <solution.icon className="w-8 h-8 text-primary" />
                  </div>
                  {/* Floating accent */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {solution.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {solution.description}
                </p>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default SolutionSection;
