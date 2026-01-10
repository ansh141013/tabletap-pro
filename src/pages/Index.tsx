import Navbar from "@/components/new_landing/Navbar";
import HeroSection from "@/components/new_landing/HeroSection";
import ProblemsSection from "@/components/new_landing/ProblemsSection";
import SolutionSection from "@/components/new_landing/SolutionSection";
import ProductPreview from "@/components/new_landing/ProductPreview";
import HowItWorks from "@/components/new_landing/HowItWorks";
import ComparisonSection from "@/components/new_landing/ComparisonSection";
import IntegrationsSection from "@/components/new_landing/IntegrationsSection";
import PricingSection from "@/components/new_landing/PricingSection";
import TestimonialsSection from "@/components/new_landing/TestimonialsSection";
import FAQSection from "@/components/new_landing/FAQSection";
import ContactSection from "@/components/new_landing/ContactSection";
import CTASection from "@/components/new_landing/CTASection";
import Footer from "@/components/new_landing/Footer";
import ScrollButton from "@/components/new_landing/ScrollButton";

const Index = () => {
  return (
    <div className="landing-page-theme min-h-screen bg-background">
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
