import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ScrollAnimation, { ScaleIn } from "./ScrollAnimation";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="bg-background">
      <div className="container-max section-padding">
        <ScaleIn>
          <div className="relative bg-surface rounded-3xl p-12 lg:p-20 overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <ScrollAnimation className="relative text-center max-w-2xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Start managing orders the smarter way
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join hundreds of restaurants that have simplified their operations with TableTap.
                Get started in minutes, not days.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/owner-setup">
                  <Button variant="landingCta" size="xl" className="gap-2">
                    Create Your Restaurant
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  Free 14-day trial · No credit card required
                </p>
              </div>
            </ScrollAnimation>
          </div>
        </ScaleIn>
      </div>
    </section>
  );
};

export default CTASection;
