import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, MapPin, Globe, DollarSign, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantData } from "@/pages/OwnerSetup";

interface RestaurantInfoStepProps {
  data: RestaurantData;
  onChange: (data: RestaurantData) => void;
  restaurantId: string | null;
}

const currencies = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "INR", label: "Indian Rupee (₹)" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

export const RestaurantInfoStep = ({ data, onChange, restaurantId }: RestaurantInfoStepProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    const { error: uploadError } = await supabase.storage
      .from('restaurant-logos')
      .upload(filePath, file);

    clearInterval(progressInterval);

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('restaurant-logos')
      .getPublicUrl(filePath);

    setUploadProgress(100);
    onChange({ ...data, logo_url: urlData.publicUrl });
    setIsUploading(false);

    toast({
      title: "Logo uploaded!",
      description: "Your restaurant logo has been uploaded successfully.",
    });
  };

  const removeLogo = () => {
    onChange({ ...data, logo_url: "" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Restaurant Information</h2>
        <p className="text-muted-foreground">
          Tell us about your restaurant. This information will be displayed to your customers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Restaurant Name */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Restaurant Name *</Label>
          <Input
            id="name"
            placeholder="e.g., The Golden Fork"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            required
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2 md:col-span-2">
          <Label>Restaurant Logo</Label>
          <div className="flex items-start gap-4">
            {data.logo_url ? (
              <div className="relative">
                <img
                  src={data.logo_url}
                  alt="Restaurant logo"
                  className="h-24 w-24 rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG or GIF. Max 5MB.
              </p>
              {isUploading && (
                <div className="mt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="location">Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="location"
              placeholder="e.g., 123 Main Street, New York, NY"
              value={data.location}
              onChange={(e) => onChange({ ...data, location: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={data.currency}
            onValueChange={(value) => onChange({ ...data, currency: value })}
          >
            <SelectTrigger>
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language">Menu Language</Label>
          <Select
            value={data.language}
            onValueChange={(value) => onChange({ ...data, language: value })}
          >
            <SelectTrigger>
              <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
};
