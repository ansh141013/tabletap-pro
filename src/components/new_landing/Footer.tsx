import { motion } from "framer-motion";
import tabletapLogo from "@/assets/tabletap-logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-4 gap-8 mb-12"
        >
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <img src={tabletapLogo} alt="TableTap" className="h-16 w-auto brightness-0 invert" />
            </div>
            <p className="text-background/70 max-w-sm text-sm leading-relaxed">
              The simplest way to manage restaurant orders. Built for restaurants that value speed,
              accuracy, and happy customers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-background/70 hover:text-background transition-colors text-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-background/70 hover:text-background transition-colors text-sm">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-background/70 hover:text-background transition-colors text-sm">
                  How it Works
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#contact" className="text-background/70 hover:text-background transition-colors text-sm">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="pt-8 border-t border-background/10"
        >
          <p className="text-background/50 text-sm text-center">
            © {new Date().getFullYear()} TableTap. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
