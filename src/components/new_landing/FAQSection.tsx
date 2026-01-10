import ScrollAnimation, { StaggerContainer, StaggerItem } from "./ScrollAnimation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How much does TableTap cost?",
    answer: "TableTap offers simple, transparent pricing starting at $49/month for small restaurants. There are no hidden fees, no per-order commissions, and no long-term contracts. You get unlimited orders and full access to all features.",
  },
  {
    question: "How long does it take to set up?",
    answer: "Most restaurants are up and running within 30 minutes. Simply add your menu items, configure your tables, and you're ready to accept orders. Our intuitive setup wizard guides you through every step.",
  },
  {
    question: "Does TableTap integrate with my existing POS system?",
    answer: "Yes! TableTap integrates with popular POS systems including Square, Toast, Clover, and more. We also offer a simple API for custom integrations. Our team can help you set up the integration that works best for your restaurant.",
  },
  {
    question: "What kind of technical support do you offer?",
    answer: "We provide 24/7 email support and live chat during business hours. Premium plans include priority phone support and a dedicated account manager. Our average response time is under 2 hours.",
  },
  {
    question: "Do my customers need to download an app?",
    answer: "No app required! Customers simply scan a QR code or visit a link to access your menu and place orders directly from their phone's browser. It works on any device without installation.",
  },
  {
    question: "Can I customize the menu and branding?",
    answer: "Absolutely. You can upload your logo, choose your brand colors, add photos for each menu item, and organize your menu exactly how you want. Your digital menu looks and feels like an extension of your restaurant.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 md:py-32 bg-surface">
      <div className="container mx-auto px-4 max-w-4xl">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              Common Questions
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to know about TableTap and how it works for your restaurant.
            </p>
          </div>
        </ScrollAnimation>

        <StaggerContainer className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <StaggerItem key={index}>
                <AccordionItem 
                  value={`item-${index}`} 
                  className="bg-background rounded-xl border-0 shadow-soft mb-4 px-6 overflow-hidden"
                >
                  <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </StaggerItem>
            ))}
          </Accordion>
        </StaggerContainer>
      </div>
    </section>
  );
};

export default FAQSection;
