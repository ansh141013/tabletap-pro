import ScrollAnimation, { ScaleIn } from "./ScrollAnimation";
import { motion } from "framer-motion";

const ProductPreview = () => {
  return (
    <section className="bg-surface overflow-hidden">
      <div className="container-max section-padding">
        <ScrollAnimation className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary mb-4 block">Product Preview</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Beautiful on every device
          </h2>
          <p className="text-muted-foreground">
            From kitchen tablets to customer phones, TableTap works seamlessly.
          </p>
        </ScrollAnimation>

        <div className="relative flex items-center justify-center gap-8 lg:gap-16">
          {/* Tablet Mockup */}
          <ScaleIn delay={0.1} className="hidden lg:block">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative">
                {/* Tablet Frame */}
                <div className="w-[400px] h-[280px] bg-foreground rounded-[2rem] p-3 shadow-elevated">
                  <div className="w-full h-full bg-background rounded-[1.5rem] overflow-hidden">
                    {/* Tablet Content */}
                    <div className="p-4 h-full">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary rounded-md"></div>
                          <span className="font-semibold text-foreground text-sm">Dashboard</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-muted-foreground">Live</span>
                        </div>
                      </div>
                      
                      {/* Order Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { table: "T4", status: "New", items: 3 },
                          { table: "T7", status: "Preparing", items: 2 },
                          { table: "T2", status: "Served", items: 1 },
                          { table: "T9", status: "New", items: 4 },
                        ].map((order, i) => (
                          <div key={i} className="bg-surface rounded-xl p-3 border border-border/50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span className="text-primary font-bold text-xs">{order.table}</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                order.status === "New" ? "bg-amber-100 text-amber-700" :
                                order.status === "Preparing" ? "bg-blue-100 text-blue-700" :
                                "bg-green-100 text-green-700"
                              }`}>{order.status}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{order.items} items</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </ScaleIn>

          {/* Phone Mockup */}
          <ScaleIn delay={0.2}>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="relative">
                {/* Phone Frame */}
                <div className="w-[220px] h-[450px] bg-foreground rounded-[2.5rem] p-2 shadow-elevated">
                  <div className="w-full h-full bg-background rounded-[2.2rem] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-b-2xl"></div>
                    
                    {/* Phone Content */}
                    <div className="pt-10 px-4 h-full">
                      {/* Header */}
                      <div className="text-center mb-4">
                        <p className="text-xs text-muted-foreground">Table 4</p>
                        <h3 className="font-semibold text-foreground">Menu</h3>
                      </div>

                      {/* Menu Items */}
                      <div className="space-y-3">
                        {[
                          { name: "Pasta Carbonara", price: "$18" },
                          { name: "Caesar Salad", price: "$12" },
                          { name: "Grilled Salmon", price: "$24" },
                        ].map((item, i) => (
                          <div key={i} className="bg-surface rounded-xl p-3 border border-border/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">{item.name}</p>
                                <p className="text-xs text-primary font-semibold">{item.price}</p>
                              </div>
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-primary-foreground text-lg">+</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div className="absolute bottom-8 left-4 right-4">
                        <div className="bg-primary rounded-2xl p-4 text-center">
                          <p className="text-primary-foreground text-sm font-medium">View Order (3)</p>
                          <p className="text-primary-foreground/80 text-xs">$54.00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </ScaleIn>

          {/* Second Phone (smaller, background) */}
          <ScaleIn delay={0.3} className="hidden md:block opacity-80 scale-90">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="relative">
                <div className="w-[200px] h-[400px] bg-foreground/80 rounded-[2.5rem] p-2 shadow-soft">
                  <div className="w-full h-full bg-background rounded-[2.2rem] overflow-hidden relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-foreground/80 rounded-b-xl"></div>
                    <div className="pt-10 px-4">
                      <div className="text-center mb-4">
                        <p className="text-xs text-muted-foreground">Order Confirmed</p>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mt-4">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="bg-surface rounded-xl p-4 border border-border/50 mt-6">
                        <p className="text-sm font-medium text-foreground text-center">Table 4</p>
                        <p className="text-xs text-muted-foreground text-center mt-1">Order #1247</p>
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <p className="text-xs text-muted-foreground text-center">Estimated time</p>
                          <p className="text-lg font-bold text-foreground text-center">15 min</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
};

export default ProductPreview;
