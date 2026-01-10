import { ClipboardList, Users, Monitor, ChefHat } from "lucide-react";
import ScrollAnimation, { StaggerContainer, StaggerItem } from "./ScrollAnimation";

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Set up your menu",
    description: "Add your menu items, set prices, and configure your tables. Takes minutes, not hours.",
  },
  {
    number: "02",
    icon: Users,
    title: "Guests place orders",
    description: "Customers order directly from their table. No app download, no login required.",
  },
  {
    number: "03",
    icon: Monitor,
    title: "Orders appear instantly",
    description: "Your dashboard shows every order in real-time. Track status at a glance.",
  },
  {
    number: "04",
    icon: ChefHat,
    title: "Kitchen prepares, staff serves",
    description: "Kitchen sees what to make. Staff knows when to serve. Everyone's in sync.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-background">
      <div className="container-max section-padding">
        <ScrollAnimation className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary mb-4 block">How It Works</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            From setup to serving in four steps
          </h2>
          <p className="text-muted-foreground">
            Get your restaurant running on TableTap in under an hour.
          </p>
        </ScrollAnimation>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent"></div>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={0.1}>
            {steps.map((step, index) => (
              <StaggerItem key={index}>
                <div className="relative text-center">
                  {/* Step Number Badge */}
                  <div className="relative inline-flex mb-6">
                    <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center border border-border/50 shadow-sm group-hover:shadow-md transition-shadow relative z-10">
                      <step.icon className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">{step.number}</span>
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
