import ScrollAnimation, { StaggerContainer, StaggerItem } from "./ScrollAnimation";
import { Check, X } from "lucide-react";

const features = [
  {
    feature: "Order accuracy",
    traditional: "Prone to errors from miscommunication",
    tableTap: "100% accurate — customers enter orders directly",
    traditionalHas: false,
    tableTapHas: true,
  },
  {
    feature: "Staff efficiency",
    traditional: "Running back and forth taking orders",
    tableTap: "Focus on service and hospitality",
    traditionalHas: false,
    tableTapHas: true,
  },
  {
    feature: "Wait time to order",
    traditional: "Customers wait for available staff",
    tableTap: "Instant — order anytime from the table",
    traditionalHas: false,
    tableTapHas: true,
  },
  {
    feature: "Kitchen coordination",
    traditional: "Paper tickets or verbal communication",
    tableTap: "Real-time digital dashboard",
    traditionalHas: false,
    tableTapHas: true,
  },
  {
    feature: "Table turnover",
    traditional: "Slower due to ordering delays",
    tableTap: "30% faster on average",
    traditionalHas: false,
    tableTapHas: true,
  },
  {
    feature: "Setup required",
    traditional: "Training staff, printed menus",
    tableTap: "20-minute setup, no app install",
    traditionalHas: true,
    tableTapHas: true,
  },
  {
    feature: "Per-order fees",
    traditional: "None",
    tableTap: "None — flat monthly pricing",
    traditionalHas: true,
    tableTapHas: true,
  },
];

const ComparisonSection = () => {
  return (
    <section id="comparison" className="py-20 md:py-32 bg-surface">
      <div className="container mx-auto px-4">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Comparison
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              TableTap vs Traditional Ordering
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See how TableTap transforms your restaurant operations compared to traditional methods.
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation>
          <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl shadow-soft bg-background">
            {/* Header */}
            <div className="grid grid-cols-3 bg-foreground text-background">
              <div className="p-4 md:p-6 font-semibold">Feature</div>
              <div className="p-4 md:p-6 font-semibold text-center border-l border-background/10">
                Traditional
              </div>
              <div className="p-4 md:p-6 font-semibold text-center border-l border-background/10 bg-primary text-primary-foreground">
                TableTap
              </div>
            </div>

            {/* Rows */}
            <StaggerContainer>
              {features.map((item, index) => (
                <StaggerItem key={index}>
                  <div
                    className={`grid grid-cols-3 ${
                      index !== features.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="p-4 md:p-6 font-medium text-foreground">
                      {item.feature}
                    </div>
                    <div className="p-4 md:p-6 text-center border-l border-border flex flex-col items-center justify-center gap-2">
                      {item.traditionalHas ? (
                        <Check className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      <span className="text-muted-foreground text-sm hidden md:block">
                        {item.traditional}
                      </span>
                    </div>
                    <div className="p-4 md:p-6 text-center border-l border-border bg-primary/5 flex flex-col items-center justify-center gap-2">
                      {item.tableTapHas ? (
                        <Check className="w-5 h-5 text-primary shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      <span className="text-foreground text-sm font-medium hidden md:block">
                        {item.tableTap}
                      </span>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default ComparisonSection;
