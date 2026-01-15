import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import {
  Store,
  MapPin,
  Utensils,
  Users,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Trash2,
  Globe,
  Upload,
  FileText,
  ArrowLeft,
  ImagePlus,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createRestaurant, updateRestaurant, getRestaurant, updateUserProfile, addTable, addCategory, uploadLogo } from "@/services/firebaseService";

// --- VALIDATION SCHEMAS ---

const restaurantTypes = ["Casual Dining", "Fine Dining", "Fast Casual", "QSR (Quick Service)", "Cafe", "Bar/Pub", "Ghost Kitchen"];
const cuisineTypes = ["American", "Italian", "Mexican", "Asian", "Indian", "Mediterranean", "French", "Other"];

// Step 1: Basics
const step1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  cuisine: z.string().min(1, "Select a cuisine"),
  type: z.string().min(1, "Select a restaurant type"),
  phone: z.string().regex(/^\+?[\d\s-]{10,}$/, "Valid phone number required"),
});

// Step 2: Location & Hours
const step2Schema = z.object({
  address: z.string().min(5, "Full address is required"),
  city: z.string().min(2, "City is required"),
  zip: z.string().min(2, "Zip code is required"),
  timezone: z.string().min(1, "Timezone is required"),
  deliveryEnabled: z.boolean().default(false),
  takeoutEnabled: z.boolean().default(true),
});

// Step 3: Menu Setup
const step3Schema = z.object({
  menuMethod: z.enum(["manual", "pdf"]),
  currency: z.string().min(1, "Currency is required"),
  taxRate: z.coerce.number().min(0).max(100),
  categories: z.array(z.object({
    name: z.string().min(1, "Category name required")
  })).min(1, "Add at least one category"),
});

// Step 4: Tables
const step4Schema = z.object({
  tableCount: z.coerce.number().min(1).max(100),
  namingConvention: z.enum(["numeric", "custom"]), // "Table 1" vs Custom
  prefix: z.string().optional(), // "Table", "Booth"
});

// Combined type for state (no Step 5 Payment)
type OnboardingData = z.infer<typeof step1Schema> &
  z.infer<typeof step2Schema> &
  z.infer<typeof step3Schema> &
  z.infer<typeof step4Schema>;


const steps = [
  { id: 1, title: "Basics", icon: Store, time: "2 min" },
  { id: 2, title: "Location", icon: MapPin, time: "2 min" },
  { id: 3, title: "Menu", icon: Utensils, time: "3 min" },
  { id: 4, title: "Tables", icon: Users, time: "2 min" },
];

const OwnerSetup = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isCelebration, setIsCelebration] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Initialize form with defaults - NO zodResolver (we validate manually per step)
  const form = useForm<Partial<OnboardingData>>({
    defaultValues: {
      menuMethod: "manual",
      currency: "USD",
      taxRate: 8,
      categories: [{ name: "Appetizers" }, { name: "Mains" }, { name: "Drinks" }],
      tableCount: 10,
      namingConvention: "numeric",
      prefix: "Table",
      deliveryEnabled: false,
      takeoutEnabled: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    mode: "onChange"
  });

  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
    control: form.control,
    name: "categories" as any,
  });

  // Load existing data
  useEffect(() => {
    if (!user) {
      if (!loading) navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        if (userProfile?.restaurantId) {
          setRestaurantId(userProfile.restaurantId);
          const data = await getRestaurant(userProfile.restaurantId);
          if (data) {
            if (data.setupComplete) {
              navigate("/dashboard");
              return;
            }
            // Pre-fill form
            form.reset({
              ...form.getValues(),
              name: data.name,
              cuisine: data.cuisine,
              // Add other fields mapping if they exist in DB
              currency: data.currency,
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, userProfile, navigate, form]);

  const handleNext = async () => {
    const data = form.getValues();
    console.log('[OwnerSetup] handleNext - Step:', currentStep, 'Data:', data);

    // Manual step-based validation
    try {
      if (currentStep === 1) {
        step1Schema.parse(data);
      } else if (currentStep === 2) {
        step2Schema.parse(data);
      } else if (currentStep === 3) {
        step3Schema.parse(data);
      } else if (currentStep === 4) {
        step4Schema.parse(data);
      }
      console.log('[OwnerSetup] Validation passed for step:', currentStep);
    } catch (validationError: any) {
      console.error('[OwnerSetup] Validation error:', validationError);
      // Show first validation error
      if (validationError.errors && validationError.errors.length > 0) {
        const firstError = validationError.errors[0];
        const fieldName = firstError.path?.[0] || 'field';
        toast({
          title: `Please fix: ${fieldName}`,
          description: firstError.message,
          variant: "destructive"
        });
      }
      return;
    }

    setSaving(true);

    try {
      if (currentStep === 1) {
        // Create/Update Restaurant
        const restData: any = {
          name: data.name!,
          cuisine: data.cuisine,
          phone: data.phone,
          ownerId: user!.uid,
          setupStep: 2,
        };

        let newRestaurantId = restaurantId;
        if (restaurantId) {
          await updateRestaurant(restaurantId, restData);
        } else {
          newRestaurantId = await createRestaurant({
            ...restData,
            currency: "USD", // Default
            location_radius: 100,
            abuse_threshold: 3,
            setupComplete: false
          } as any);
          setRestaurantId(newRestaurantId);
          await updateUserProfile(user!.uid, { restaurantId: newRestaurantId });
        }

        // Upload logo if selected
        if (logoFile && newRestaurantId) {
          setUploadingLogo(true);
          try {
            const logoUrl = await uploadLogo(logoFile, newRestaurantId);
            await updateRestaurant(newRestaurantId, { logo_url: logoUrl } as any);
          } catch (logoErr) {
            console.error('Logo upload failed:', logoErr);
            toast({ title: "Logo upload failed", description: "You can add it later in settings.", variant: "destructive" });
          } finally {
            setUploadingLogo(false);
          }
        }
      } else if (currentStep === 2) {
        if (restaurantId) {
          await updateRestaurant(restaurantId, {
            address: data.address, // TODO: Update model to support these fields
            timezone: data.timezone,
            setupStep: 3
          } as any);
        }
      } else if (currentStep === 3) {
        if (restaurantId) {
          await updateRestaurant(restaurantId, {
            currency: data.currency,
            taxRate: data.taxRate,
            setupStep: 4
          } as any);

          // Create default categories
          for (const cat of (data.categories as any[])) {
            await addCategory({
              ownerId: user!.uid,
              restaurantId,
              name: cat.name,
              displayOrder: 0
            });
          }
        }
      } else if (currentStep === 4) {
        // Generate Tables
        if (restaurantId) {
          const count = Number(data.tableCount);
          const prefix = data.prefix || "Table";
          for (let i = 1; i <= count; i++) {
            await addTable({
              ownerId: user!.uid,
              restaurantId,
              number: String(i),
              seats: 4,
              status: 'available',
              isLocked: false
            });
          }
          // Step 4 is the last step now, finish setup
          await finishSetup();
          return; // Early return to prevent going to step 5
        }
      }

      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo(0, 0);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error saving progress", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const finishSetup = async () => {
    if (!restaurantId) return;
    await updateRestaurant(restaurantId, { setupComplete: true } as any);
    setIsCelebration(true);
    setTimeout(() => {
      navigate("/dashboard");
      toast({ title: "Welcome to TableTap!", description: "Your restaurant is ready." });
    }, 3000);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const currentProgress = (currentStep / steps.length) * 100;

  return (
    <div className={`min-h-screen bg-slate-50/50 dark:bg-zinc-950 pb-20 ${isCelebration ? "overflow-hidden" : ""}`}>
      {isCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center text-white"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold">You're All Set!</h2>
            <p className="text-xl opacity-80">Launching your dashboard...</p>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            <Store className="h-5 w-5" />
          </div>
          TableTap <span className="text-muted-foreground font-normal text-sm ml-2">Setup</span>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {steps[currentStep - 1].time} remaining
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto pt-28 px-4">
        <div className="mb-8">
          <Progress value={currentProgress} className="h-2" />
          <div className="flex justify-between mt-4 px-2">
            {steps.map(step => (
              <div key={step.id} className={`flex flex-col items-center gap-1 ${step.id === currentStep ? "text-primary font-medium" : "text-muted-foreground opacity-50"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 
                           ${step.id < currentStep ? "bg-primary border-primary text-primary-foreground" :
                    step.id === currentStep ? "border-primary text-primary" : "border-muted"}`}>
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                </div>
                <span className="text-xs hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{steps[currentStep - 1].title}</CardTitle>
                <CardDescription>
                  Step {currentStep}: Configure your restaurant details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-6">

                    {/* STEP 1: BASICS */}
                    {currentStep === 1 && (
                      <>
                        {/* Logo Upload */}
                        <div className="flex flex-col items-center gap-4 mb-6">
                          <Label className="text-center">Restaurant Logo</Label>
                          <div className="relative">
                            {logoPreview ? (
                              <div className="relative">
                                <img
                                  src={logoPreview}
                                  alt="Logo preview"
                                  className="w-24 h-24 rounded-xl object-cover border-2 border-primary shadow-md"
                                />
                                <button
                                  type="button"
                                  onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-md hover:bg-destructive/90"
                                  aria-label="Remove logo"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30">
                                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-1">Add Logo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setLogoFile(file);
                                      setLogoPreview(URL.createObjectURL(file));
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">Optional. PNG/JPG, max 2MB</p>
                        </div>
                        <Separator className="my-4" />

                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Restaurant Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl><Input placeholder="e.g. Luigi's Trattoria" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="cuisine" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cuisine</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {cuisineTypes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {restaurantTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Contact Phone</FormLabel>
                            <FormControl><Input type="tel" placeholder="+1 (555) 000-0000" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </>
                    )}

                    {/* STEP 2: LOCATION */}
                    {currentStep === 2 && (
                      <>
                        <FormField control={form.control} name="address" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="Start typing address..." {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>We'll auto-detect your timezone from this.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl><Input placeholder="City" {...field} /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="zip" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zip Code</FormLabel>
                              <FormControl><Input placeholder="12345" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="timezone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <div className="flex gap-2">
                              <Globe className="h-5 w-5 mt-2 text-muted-foreground" />
                              <FormControl><Input {...field} readOnly className="bg-muted" /></FormControl>
                            </div>
                          </FormItem>
                        )} />
                        <Separator />
                        <div className="space-y-4">
                          <FormField control={form.control} name="deliveryEnabled" render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Delivery</FormLabel>
                                <FormDescription>Enable delivery orders</FormDescription>
                              </div>
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="takeoutEnabled" render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Takeout / Pickup</FormLabel>
                                <FormDescription>Allow customers to pick up</FormDescription>
                              </div>
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </>
                    )}

                    {/* STEP 3: MENU */}
                    {currentStep === 3 && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div
                            className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${form.watch("menuMethod") === "manual" ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}
                            onClick={() => form.setValue("menuMethod", "manual")}
                          >
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="font-semibold">Enter Manually</div>
                            <p className="text-xs text-center text-muted-foreground">Add items one by one. Best for control.</p>
                          </div>
                          <div
                            className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${form.watch("menuMethod") === "pdf" ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}
                            onClick={() => form.setValue("menuMethod", "pdf")}
                          >
                            <Upload className="h-8 w-8 text-primary" />
                            <div className="font-semibold">Upload PDF</div>
                            <p className="text-xs text-center text-muted-foreground">We'll transcribe it for you (Beta).</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="currency" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="USD">USD ($)</SelectItem>
                                  <SelectItem value="EUR">EUR (€)</SelectItem>
                                  <SelectItem value="GBP">GBP (£)</SelectItem>
                                  <SelectItem value="INR">INR (₹)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="taxRate" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tax Rate (%)</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <div className="space-y-3">
                          <Label>Quick Categories</Label>
                          {categoryFields.map((field, index) => (
                            <div key={field.id} className="flex gap-2">
                              <FormField
                                control={form.control}
                                name={`categories.${index}.name`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCategory(index)}
                                disabled={categoryFields.length <= 1}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => appendCategory({ name: "" })}>
                            <Plus className="h-4 w-4 mr-2" /> Add Category
                          </Button>
                        </div>
                      </>
                    )}

                    {/* STEP 4: TABLES */}
                    {currentStep === 4 && (
                      <>
                        <div className="bg-muted/50 p-6 rounded-xl flex flex-col items-center justify-center space-y-4">
                          <h3 className="text-lg font-medium">How many tables do you have?</h3>
                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-12 w-12"
                              onClick={() => {
                                const val = form.getValues("tableCount") || 1;
                                if (val > 1) form.setValue("tableCount", val - 1);
                              }}
                            >
                              <ArrowLeft className="h-4 w-4" /> {/* Minus icon visually but logic is minus */}
                            </Button>
                            <FormField control={form.control} name="tableCount" render={({ field }) => (
                              <div className="text-4xl font-bold w-16 text-center tabular-nums">{field.value}</div>
                            )} />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-12 w-12"
                              onClick={() => {
                                const val = form.getValues("tableCount") || 1;
                                form.setValue("tableCount", val + 1);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <FormField control={form.control} name="namingConvention" render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Table Labels</FormLabel>
                            <FormControl>
                              <div className="flex flex-col gap-2">
                                <div
                                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${field.value === 'numeric' ? 'border-primary bg-primary/5' : ''}`}
                                  onClick={() => form.setValue("namingConvention", "numeric")}
                                >
                                  <div className="h-4 w-4 rounded-full border border-primary flex items-center justify-center">
                                    {field.value === 'numeric' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                  </div>
                                  <span>Standard (Table 1, Table 2...)</span>
                                </div>
                                <div
                                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${field.value === 'custom' ? 'border-primary bg-primary/5' : ''}`}
                                  onClick={() => form.setValue("namingConvention", "custom")}
                                >
                                  <div className="h-4 w-4 rounded-full border border-primary flex items-center justify-center">
                                    {field.value === 'custom' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                  </div>
                                  <span>Custom Prefix (Booth 1, Patio 2...)</span>
                                </div>
                              </div>
                            </FormControl>
                          </FormItem>
                        )} />

                        {form.watch("namingConvention") === "custom" && (
                          <FormField control={form.control} name="prefix" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prefix</FormLabel>
                              <FormControl><Input placeholder="e.g. Booth" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        )}
                      </>
                    )}

                    {/* Step 5 (Payment) removed */}

                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-between items-center z-40 max-w-2xl mx-auto w-full md:relative md:max-w-2xl md:bg-transparent md:border-t-0 md:p-0 md:mt-8">
        <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1 || saving}>
          Back
        </Button>

        <div className="flex gap-2">
          {/* Optional Skip Button (only for non-essential steps if needed) */}
          <Button onClick={handleNext} disabled={saving || uploadingLogo}>
            {(saving || uploadingLogo) ? <Loader2 className="animate-spin mr-2" /> : null}
            {currentStep === 4 ? "Launch Restaurant" : "Next Step"}
            {!saving && !uploadingLogo && currentStep !== 4 && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default OwnerSetup;
