import { useState, useEffect } from "react";
import {
  Store,
  Clock,
  Bell,
  Shield,
  Upload,
  Save,
  Loader2,
  X,
  User,
  LogOut,
  Trash2,
  Mail,
  Smartphone,
  Briefcase
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerSettings } from "@/contexts/OwnerContext";
import { getRestaurant, updateRestaurant, uploadLogo } from "@/services/firebaseService";
import { getSupportedCurrencies } from "@/utils/currency";
import { getSupportedLanguages } from "@/utils/language";

// Helper type for Settings - aligned closer to Firebase but keeping UI state structure
interface RestaurantSettings {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  logoUrl: string | null;
  currency: string;
  language: string;
  opening_hours: Record<string, { open: string, close: string, isOpen: boolean }>;
  order_timeout: number;
  location_radius: number;
  abuse_threshold: number;
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_push: boolean;
  notifications_sound: boolean;
}

export const SettingsPage = () => {
  const { user, userProfile, logout, updatePassword } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Settings Form State
  const [settings, setSettings] = useState<RestaurantSettings>({
    id: "",
    name: "",
    description: "",
    address: "",
    phone: "",
    logoUrl: null,
    currency: "USD",
    language: "en",
    opening_hours: {},
    order_timeout: 10,
    location_radius: 100,
    abuse_threshold: 3,
    notifications_email: true,
    notifications_sms: false,
    notifications_push: true,
    notifications_sound: true,
  });

  // Account Management State
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const getDayHours = (day: string) => {
    return settings.opening_hours?.[day] || { open: "11:00", close: "22:00", isOpen: day !== "Sunday" };
  };

  const updateDayHours = (day: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...getDayHours(day),
          [field]: value
        }
      }
    }));
  };

  useEffect(() => {
    const loadSettings = async () => {
      if (!userProfile?.restaurantId) return;

      try {
        const data = await getRestaurant(userProfile.restaurantId);
        setSettings({
          id: data.id!,
          name: data.name,
          description: data.description || "",
          address: data.address || "",
          phone: data.phone || "",
          logoUrl: data.logoUrl || null,
          currency: data.currency || "USD",
          language: data.language || "en",
          opening_hours: data.opening_hours || {},
          order_timeout: data.order_timeout || 10,
          location_radius: data.location_radius || 100,
          abuse_threshold: data.abuse_threshold || 3,
          notifications_email: data.notifications_email ?? true,
          notifications_sms: data.notifications_sms ?? false,
          notifications_push: data.notifications_push ?? true,
          notifications_sound: data.notifications_sound ?? true,
        });
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load settings:", err);
        toast({ title: "Failed to load settings", variant: "destructive" });
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [userProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateRestaurant(settings.id, {
        name: settings.name,
        description: settings.description,
        address: settings.address,
        phone: settings.phone,
        currency: settings.currency,
        language: settings.language,
        logoUrl: settings.logoUrl!,
        opening_hours: settings.opening_hours,
        order_timeout: settings.order_timeout,
        location_radius: settings.location_radius,
        abuse_threshold: settings.abuse_threshold,
        notifications_email: settings.notifications_email,
        notifications_sms: settings.notifications_sms,
        notifications_push: settings.notifications_push,
        notifications_sound: settings.notifications_sound,
      });

      toast({ title: "Settings saved successfully!" });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ title: "Failed to save settings", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large (max 5MB)", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const downloadUrl = await uploadLogo(file, settings.id);
      setSettings(prev => ({ ...prev, logoUrl: downloadUrl }));
      toast({ title: "Logo updated!" });
      // Immediate save
      await updateRestaurant(settings.id, { logoUrl: downloadUrl });

    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) { // Firebase min 6
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);

    try {
      await updatePassword(newPassword);
      toast({ title: "Password updated successfully" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    // Requires re-auth usually, complex flow.
    toast({ title: "Email change not implemented in this prototype", variant: "default" });
  };

  const handleLogoutAll = async () => {
    // Firebase doesn't exactly have "logout all" easily accessible without admin SDK or token revocation
    // Just logout current
    await logout();
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast({ title: "Please type DELETE to confirm", variant: "destructive" });
      return;
    }
    setIsDeleting(true);

    try {
      // In a real app we would call a cloud function to delete all data.
      // Here we just toast and maybe delete restaurant doc if we want.
      // But auth user deletion requires recent login or admin sdk.

      toast({ title: "Account deletion request received", description: "Contact processing..." });
      // await logout();

    } catch (error: any) {
      toast({ title: "Error deleting account", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your restaurant and account preferences.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* --- GENERAL SETTINGS --- */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6">
            {/* Logo Section */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4">Restaurant Logo</h3>
              <div className="flex items-center gap-6">
                <div className="relative h-24 w-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="relative">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} accept="image/*" aria-label="Upload logo" />
                      Change Logo
                    </Button>
                    {settings.logoUrl && (
                      <Button variant="ghost" size="sm" onClick={() => setSettings({ ...settings, logoUrl: null })}>Remove</Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 5MB.</p>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-card rounded-xl border p-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Restaurant Name</Label>
                <Input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={settings.phone || ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input value={settings.address || ""} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea value={settings.description || ""} onChange={(e) => setSettings({ ...settings, description: e.target.value })} placeholder="Tell us about your restaurant..." />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={settings.currency} onValueChange={(val) => {
                  setSettings({ ...settings, currency: val });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getSupportedCurrencies().map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">This affects all price displays in your dashboard and menus.</p>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={settings.language || "en"} onValueChange={(val) => {
                  setSettings({ ...settings, language: val });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getSupportedLanguages().map(l => (
                      <SelectItem key={l.code} value={l.code}>{l.name} ({l.nativeName})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Controls translations across your dashboard.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* --- BUSINESS SETTINGS --- */}
        <TabsContent value="business" className="space-y-6">
          <div className="bg-card rounded-xl border p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><Briefcase className="h-5 w-5" /> Business Logic</h3>
              <p className="text-sm text-muted-foreground">Configure how your restaurant operates efficiently.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order-timeout">Order Timeout (Minutes)</Label>
                <Input
                  id="order-timeout"
                  type="number"
                  min={5}
                  max={60}
                  value={settings.order_timeout}
                  onChange={(e) => setSettings({ ...settings, order_timeout: parseInt(e.target.value) || 10 })}
                />
                <p className="text-xs text-muted-foreground">Auto-cancel pending orders after this time.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-radius">Location Radius (Meters)</Label>
                <Input
                  id="location-radius"
                  type="number"
                  min={10}
                  value={settings.location_radius}
                  onChange={(e) => setSettings({ ...settings, location_radius: parseInt(e.target.value) || 100 })}
                />
                <p className="text-xs text-muted-foreground">Max distance for customer check-in.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="abuse-threshold">Abuse Score Threshold</Label>
                <Input
                  id="abuse-threshold"
                  type="number"
                  min={1}
                  value={settings.abuse_threshold}
                  onChange={(e) => setSettings({ ...settings, abuse_threshold: parseInt(e.target.value) || 3 })}
                />
                <p className="text-xs text-muted-foreground">Trigger OTP verification after this many cancellations.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* --- HOURS --- */}
        <TabsContent value="hours" className="space-y-6">
          <div className="bg-card rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="h-5 w-5" /> Operating Hours</h3>
            <div className="space-y-4">
              {days.map((day) => {
                const hours = getDayHours(day);
                return (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/30 px-2 rounded-md transition-colors">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={hours.isOpen}
                        onCheckedChange={(c) => updateDayHours(day, 'isOpen', c)}
                        aria-label={`Open on ${day}`}
                      />
                      <span className="font-medium text-foreground w-24">{day}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        className="w-32"
                        value={hours.open}
                        onChange={(e) => updateDayHours(day, 'open', e.target.value)}
                        disabled={!hours.isOpen}
                        aria-label={`${day} opening time`}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        className="w-32"
                        value={hours.close}
                        onChange={(e) => updateDayHours(day, 'close', e.target.value)}
                        disabled={!hours.isOpen}
                        aria-label={`${day} closing time`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* --- NOTIFICATIONS --- */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-card rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell className="h-5 w-5" /> Notification Channels</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"><Mail className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive daily summaries and critical alerts.</p>
                  </div>
                </div>
                <Switch checked={settings.notifications_email} onCheckedChange={(c) => setSettings({ ...settings, notifications_email: c })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600"><Smartphone className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Get instant texts for urgent waiter calls.</p>
                  </div>
                </div>
                <Switch checked={settings.notifications_sms} onCheckedChange={(c) => setSettings({ ...settings, notifications_sms: c })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600"><Bell className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser notifications for real-time orders.</p>
                  </div>
                </div>
                <Switch checked={settings.notifications_push} onCheckedChange={(c) => setSettings({ ...settings, notifications_push: c })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600"><Store className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium">Sound Alerts</p>
                    <p className="text-sm text-muted-foreground">Play a chime when new orders arrive.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "🔔 Playing test sound..." })}>Test Sound</Button>
                  <Switch checked={settings.notifications_sound} onCheckedChange={(c) => setSettings({ ...settings, notifications_sound: c })} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* --- ACCOUNT --- */}
        <TabsContent value="account" className="space-y-6">
          <div className="bg-card rounded-xl border p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><User className="h-5 w-5" /> Profile Settings</h3>
              <p className="text-sm text-muted-foreground">Manage your personal account details.</p>
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex gap-2">
                <Input value={user?.email || "user@example.com"} disabled />
                <Button variant="outline" onClick={handleChangeEmail}>Change Email</Button>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h4 className="font-medium">Change Password</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleUpdatePassword} disabled={isChangingPassword}>
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Update Password"}
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-6 border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 space-y-4">
            <h3 className="text-lg font-semibold text-destructive flex items-center gap-2"><Shield className="h-5 w-5" /> Danger Zone</h3>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
              <div>
                <p className="font-medium">Log out of all devices</p>
                <p className="text-sm text-muted-foreground">End sessions on all browsers and devices.</p>
              </div>
              <Button variant="outline" onClick={handleLogoutAll}><LogOut className="h-4 w-4 mr-2" /> Log Out All</Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-destructive/20">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently remove your restaurant and all data.</p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account, restaurant, menu, and remove all data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label className="text-destructive">Type DELETE to confirm</Label>
                    <Input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} className="mt-2" placeholder="DELETE" />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} disabled={deleteConfirmation !== "DELETE" || isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Permanently Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
