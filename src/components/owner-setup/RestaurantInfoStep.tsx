import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, MapPin, Globe, DollarSign, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RestaurantData } from "@/types/models";

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
  const { toast } = useToast();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Stub for Firebase Storage Upload
    const file = e.target.files?.[0];
    if (file) {
      toast({ title: "Logo Upload", description: "Use URL manually for now as Storage is not fully configured in stub", variant: "destructive" });
    }
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

        {/* Logo URL Manual Input (Temporary replacement for upload) */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="logo">Restaurant Logo URL</Label>
          <Input
            id="logo"
            placeholder="https://example.com/logo.png"
            value={data.logo_url}
            onChange={(e) => onChange({ ...data, logo_url: e.target.value })}
          />
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
