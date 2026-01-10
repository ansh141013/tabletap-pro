import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemsSection from "@/components/ProblemsSection";
import SolutionSection from "@/components/SolutionSection";
import ProductPreview from "@/components/ProductPreview";
import HowItWorks from "@/components/HowItWorks";
import ComparisonSection from "@/components/ComparisonSection";
import IntegrationsSection from "@/components/IntegrationsSection";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ScrollButton from "@/components/ScrollButton";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProblemsSection />
      <SolutionSection />
      <ProductPreview />
      <HowItWorks />
      <ComparisonSection />
      <IntegrationsSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <CTASection />
      <Footer />
      <ScrollButton />
    </div>
  );
};

export default Index;
