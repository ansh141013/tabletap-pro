import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Store,
  Clock,
  Bell,
  QrCode,
  Upload,
  Save,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RestaurantSettings {
  id: string;
  name: string;
  logo_url: string | null;
  location: string | null;
  currency: string;
  language: string;
}

export const SettingsPage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", session.user.id)
        .single();

      if (data) {
        setSettings({
          id: data.id,
          name: data.name,
          logo_url: data.logo_url,
          location: data.location,
          currency: data.currency || "USD",
          language: data.language || "en",
        });
      }
      setIsLoading(false);
    };

    loadSettings();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large (max 5MB)", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("restaurant-logos")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("restaurant-logos")
      .getPublicUrl(filePath);

    setSettings({ ...settings, logo_url: urlData.publicUrl });
    setIsUploading(false);
    toast({ title: "Logo uploaded!" });
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("restaurants")
      .update({
        name: settings.name,
        logo_url: settings.logo_url,
        location: settings.location,
        currency: settings.currency,
        language: settings.language,
      })
      .eq("id", settings.id);

    if (error) {
      toast({ title: "Failed to save", variant: "destructive" });
    } else {
      toast({ title: "Settings saved!" });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Store className="h-4 w-4 hidden sm:block" />
            General
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="h-4 w-4 hidden sm:block" />
            Hours
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4 hidden sm:block" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="qr" className="gap-2">
            <QrCode className="h-4 w-4 hidden sm:block" />
            QR & Ordering
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Restaurant Information</h3>
                <p className="text-sm text-muted-foreground">Basic details about your restaurant.</p>
              </div>

              <div className="flex items-center gap-6">
                {settings?.logo_url ? (
                  <div className="relative">
                    <img
                      src={settings.logo_url}
                      alt="Logo"
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <button
                      onClick={() => setSettings({ ...settings!, logo_url: null })}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("logo-upload")?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 200x200px, PNG or JPG
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={settings?.name || ""}
                    onChange={(e) => setSettings({ ...settings!, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Address</Label>
                  <Input
                    id="location"
                    value={settings?.location || ""}
                    onChange={(e) => setSettings({ ...settings!, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings?.currency || "USD"}
                    onValueChange={(value) => setSettings({ ...settings!, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings?.language || "en"}
                    onValueChange={(value) => setSettings({ ...settings!, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Operating Hours */}
        <TabsContent value="hours">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Operating Hours</h3>
                <p className="text-sm text-muted-foreground">Set your restaurant's opening hours.</p>
              </div>

              <div className="space-y-4">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-4">
                      <Switch defaultChecked={day !== "Sunday"} />
                      <span className="font-medium text-foreground w-24">{day}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="time" defaultValue="11:00" className="w-32" />
                      <span className="text-muted-foreground">to</span>
                      <Input type="time" defaultValue="22:00" className="w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">Choose how you want to be notified.</p>
              </div>

              <div className="space-y-4">
                {[
                  { label: "New order notifications", description: "Get notified when a new order is placed", defaultChecked: true },
                  { label: "Waiter call alerts", description: "Alert when a customer calls for service", defaultChecked: true },
                  { label: "Order timeout warnings", description: "Warn when an order is pending too long", defaultChecked: true },
                  { label: "Sound notifications", description: "Play sound for new orders and alerts", defaultChecked: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* QR & Ordering */}
        <TabsContent value="qr">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">QR Code Settings</h3>
                <p className="text-sm text-muted-foreground">Customize your QR ordering experience.</p>
              </div>

              <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
                <div className="h-24 w-24 bg-white rounded-lg p-2 flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground mb-2">Your Restaurant QR Code</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Download All
                    </Button>
                    <Button variant="outline" size="sm">
                      Customize Design
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Allow guest ordering", description: "Let customers order without creating an account", defaultChecked: true },
                  { label: "Require phone number", description: "Ask for phone number during checkout", defaultChecked: true },
                  { label: "Enable waiter call button", description: "Show 'Call Waiter' button on guest menu", defaultChecked: true },
                  { label: "Enable order notes", description: "Allow customers to add notes to their orders", defaultChecked: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Order Timeout</h3>
                <p className="text-sm text-muted-foreground">Configure automatic order timeout settings.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Pending order timeout (minutes)</Label>
                  <Input id="timeout" type="number" defaultValue="10" />
                  <p className="text-xs text-muted-foreground">
                    Orders will be auto-cancelled if not accepted within this time.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
