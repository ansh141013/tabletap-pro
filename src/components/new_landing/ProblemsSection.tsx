import { AlertCircle, Clock, Users, HelpCircle } from "lucide-react";
import ScrollAnimation, { StaggerContainer, StaggerItem } from "./ScrollAnimation";

const problems = [
  {
    icon: Users,
    title: "Staff running back and forth",
    description: "Servers waste time taking orders manually instead of serving customers.",
  },
  {
    icon: AlertCircle,
    title: "Missed or wrong orders",
    description: "Handwritten notes and verbal orders lead to costly mistakes.",
  },
  {
    icon: Clock,
    title: "Customers waiting to order",
    description: "Long waits frustrate guests and slow down table turnover.",
  },
  {
    icon: HelpCircle,
    title: "Confusing systems",
    description: "Complex POS systems require extensive training and still fail.",
  },
];

const ProblemsSection = () => {
  return (
    <section id="problems" className="bg-surface">
      <div className="container-max section-padding">
        <ScrollAnimation className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-medium text-primary mb-4 block">The Problem</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Restaurant chaos costs you money
          </h2>
          <p className="text-muted-foreground">
            Every day, restaurants lose revenue and customers to outdated order management.
          </p>
        </ScrollAnimation>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
          {problems.map((problem, index) => (
            <StaggerItem key={index}>
              <div className="bg-background rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4">
                  <problem.icon className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {problem.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default ProblemsSection;
