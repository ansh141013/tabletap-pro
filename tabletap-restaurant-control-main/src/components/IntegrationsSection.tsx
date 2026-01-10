import ScrollAnimation, { StaggerContainer, StaggerItem } from "./ScrollAnimation";

const integrations = [
  { name: "Square", color: "#006AFF" },
  { name: "Toast", color: "#FF6B35" },
  { name: "Clover", color: "#1DB954" },
  { name: "Lightspeed", color: "#E4002B" },
  { name: "Revel", color: "#5B2C6F" },
  { name: "TouchBistro", color: "#FF5722" },
];

const IntegrationsSection = () => {
  return (
    <section id="integrations" className="py-16 md:py-24 bg-background border-y border-border">
      <div className="container mx-auto px-4">
        <ScrollAnimation>
          <div className="text-center mb-12">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Integrations
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-2 mb-4">
              Works With Your Existing POS
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              TableTap integrates seamlessly with the most popular point-of-sale systems.
            </p>
          </div>
        </ScrollAnimation>

        <StaggerContainer className="flex flex-wrap justify-center items-center gap-8 md:gap-12 max-w-4xl mx-auto">
          {integrations.map((integration, index) => (
            <StaggerItem key={index}>
              <div className="group flex items-center justify-center px-6 py-4 rounded-xl bg-surface shadow-soft hover:shadow-medium transition-shadow duration-300">
                <span 
                  className="text-xl md:text-2xl font-bold tracking-tight transition-colors duration-300"
                  style={{ color: integration.color }}
                >
                  {integration.name}
                </span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollAnimation>
          <p className="text-center text-muted-foreground text-sm mt-10">
            Don't see your POS? <span className="text-primary font-medium cursor-pointer hover:underline">Contact us</span> for custom integrations.
          </p>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default IntegrationsSection;
