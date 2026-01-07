import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UtensilsCrossed, 
  Store, 
  LayoutGrid, 
  Utensils, 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantInfoStep } from "@/components/owner-setup/RestaurantInfoStep";
import { CategoriesStep } from "@/components/owner-setup/CategoriesStep";
import { MenuItemsStep } from "@/components/owner-setup/MenuItemsStep";

export interface RestaurantData {
  name: string;
  logo_url: string;
  location: string;
  currency: string;
  language: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  available: boolean;
}

const steps = [
  { id: 1, title: "Restaurant Info", icon: Store },
  { id: 2, title: "Categories", icon: LayoutGrid },
  { id: 3, title: "Menu Items", icon: Utensils },
];

const OwnerSetup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [restaurantData, setRestaurantData] = useState<RestaurantData>({
    name: "",
    logo_url: "",
    location: "",
    currency: "USD",
    language: "en",
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUserId(session.user.id);

      // Check if restaurant already exists
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();

      if (existingRestaurant) {
        if (existingRestaurant.setup_complete) {
          navigate('/dashboard');
          return;
        }
        
        setRestaurantId(existingRestaurant.id);
        setRestaurantData({
          name: existingRestaurant.name || "",
          logo_url: existingRestaurant.logo_url || "",
          location: existingRestaurant.location || "",
          currency: existingRestaurant.currency || "USD",
          language: existingRestaurant.language || "en",
        });

        // Load existing categories
        const { data: existingCategories } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', existingRestaurant.id);

        if (existingCategories) {
          setCategories(existingCategories.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || "",
          })));
        }

        // Load existing menu items
        const { data: existingMenuItems } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', existingRestaurant.id);

        if (existingMenuItems) {
          setMenuItems(existingMenuItems.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description || "",
            price: Number(m.price),
            category_id: m.category_id,
            image_url: m.image_url || "",
            available: m.available,
          })));
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!restaurantData.name.trim()) {
          toast({
            title: "Validation Error",
            description: "Restaurant name is required",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 2:
        if (categories.length === 0) {
          toast({
            title: "Validation Error",
            description: "Please add at least one category",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 3:
        if (menuItems.length === 0) {
          toast({
            title: "Validation Error",
            description: "Please add at least one menu item",
            variant: "destructive",
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // Save data at each step
    if (currentStep === 1) {
      await saveRestaurantInfo();
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveRestaurantInfo = async () => {
    if (!userId) return;

    setIsSaving(true);
    
    if (restaurantId) {
      // Update existing
      await supabase
        .from('restaurants')
        .update({
          name: restaurantData.name,
          logo_url: restaurantData.logo_url,
          location: restaurantData.location,
          currency: restaurantData.currency,
          language: restaurantData.language,
        })
        .eq('id', restaurantId);
    } else {
      // Create new
      const { data } = await supabase
        .from('restaurants')
        .insert({
          owner_id: userId,
          name: restaurantData.name,
          logo_url: restaurantData.logo_url,
          location: restaurantData.location,
          currency: restaurantData.currency,
          language: restaurantData.language,
        })
        .select()
        .single();

      if (data) {
        setRestaurantId(data.id);
      }
    }

    setIsSaving(false);
  };

  const handleFinishSetup = async () => {
    if (!validateStep(3) || !restaurantId) return;

    setIsSaving(true);

    // Mark setup as complete
    const { error } = await supabase
      .from('restaurants')
      .update({ setup_complete: true })
      .eq('id', restaurantId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    toast({
      title: "Setup Complete!",
      description: "Your restaurant is ready to accept orders.",
    });

    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-warm shadow-md">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">TableTap Setup</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  step.id <= currentStep ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    step.id < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id === currentStep
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-xl border shadow-lg p-6 md:p-8"
        >
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <RestaurantInfoStep
                data={restaurantData}
                onChange={setRestaurantData}
                restaurantId={restaurantId}
              />
            )}
            {currentStep === 2 && restaurantId && (
              <CategoriesStep
                categories={categories}
                setCategories={setCategories}
                restaurantId={restaurantId}
              />
            )}
            {currentStep === 3 && restaurantId && (
              <MenuItemsStep
                menuItems={menuItems}
                setMenuItems={setMenuItems}
                categories={categories}
                restaurantId={restaurantId}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSaving}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={handleNext} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinishSetup} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Finish Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerSetup;
