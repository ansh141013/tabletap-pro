import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { calculateDistance } from "@/utils/location";
import { Loader2, MapPin, CheckCircle, AlertTriangle, ShieldCheck, ArrowLeft, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface RestaurantCheckout {
    id: string;
    name: string;
    currency: string;
    location_radius: number;
    latitude: number | null;
    longitude: number | null;
    abuse_threshold: number;
}

const CheckoutPage = () => {
    const { restaurantId } = useParams<{ restaurantId: string }>();
    const [searchParams] = useSearchParams();
    const tableId = searchParams.get("table");
    const navigate = useNavigate();
    const { toast } = useToast();
    const { cart, totalPrice, clearCart } = useCart(restaurantId, tableId);

    // States
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<RestaurantCheckout | null>(null);

    // Step 1: Location
    const [isLocationChecking, setIsLocationChecking] = useState(true);
    const [isLocationValid, setIsLocationValid] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Step 2: Customer Form
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

    // Step 3: Abuse & OTP
    const [checkingAbuse, setCheckingAbuse] = useState(false);
    const [needsOtp, setNeedsOtp] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpTimeLeft, setOtpTimeLeft] = useState(0);
    const [otpVerified, setOtpVerified] = useState(false);

    // Final Order
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // Initial Fetch
    useEffect(() => {
        if (!restaurantId) {
            return;
        }
        // Redirect if cart empty and not loading? 
        // We'll let the user see empty state or redirect in render if strict.
        // For now, let's just fetch.

        if (cart.length === 0 && !loading) {
            navigate(`/menu/${restaurantId}${tableId ? `?table=${tableId}` : ''}`);
            return;
        }

        const fetchData = async () => {
            try {
                const { data: rData, error: rError } = await supabase
                    .from("restaurants")
                    .select("id, name, currency, location_radius, latitude, longitude, abuse_threshold")
                    .eq("id", restaurantId)
                    .single();

                if (rError || !rData) throw new Error("Restaurant not found");

                const d = rData as any;
                // Defaults
                if (d.location_radius === undefined) d.location_radius = 100;
                if (d.abuse_threshold === undefined) d.abuse_threshold = 3;

                setRestaurant(d as RestaurantCheckout);

                // Fetch Table Number
                if (tableId) {
                    const { data: tData } = await supabase
                        .from("tables")
                        .select("table_number")
                        .eq("id", tableId)
                        .single();
                    if (tData) {
                        // We'll store this in a ref or state if needed, but for now just need it for order
                        // Let's add it to a state
                        setTableNumber(tData.table_number);
                    }
                } else {
                    // If no tableId, maybe redirect? Or pickup? Prompt implies table context.
                }

                setLoading(false);
                checkLocation(d as RestaurantCheckout);

            } catch (err) {
                console.error(err);
                toast({ title: "Failed to load checkout", variant: "destructive" });
                setLoading(false);
            }
        };

        fetchData();
    }, [restaurantId, cart.length]);

    const [tableNumber, setTableNumber] = useState<number | null>(null);

    // Location Check
    const checkLocation = (r: RestaurantCheckout) => {
        setIsLocationChecking(true);
        setLocationError(null);

        if (!r.latitude || !r.longitude) {
            // Fail open if no coords setup
            setIsLocationValid(true);
            setIsLocationChecking(false);
            // toast({ title: "Location check passed (Dev)" });
            return;
        }

        if (!navigator.geolocation) {
            setLocationError("Geolocation not supported");
            setIsLocationChecking(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const dist = calculateDistance(
                    position.coords.latitude,
                    position.coords.longitude,
                    r.latitude!,
                    r.longitude!
                );
                setDistance(dist);

                if (dist <= (r.location_radius || 100)) {
                    setIsLocationValid(true);
                } else {
                    setIsLocationValid(false);
                }
                setIsLocationChecking(false);
            },
            (err) => {
                console.error(err);
                setLocationError("Location access required/failed");
                setIsLocationChecking(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Field Validation
    const validateForm = () => {
        const newErrors: any = {};
        if (!name.trim() || name.length < 2 || !/^[a-zA-Z\s]*$/.test(name)) {
            newErrors.name = "Name must be 2-30 characters, letters only";
        }
        if (!phone.replace(/\D/g, '').match(/^\d{10,15}$/)) {
            newErrors.phone = "Valid mobile number required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const formatPhone = (val: string) => {
        // Basic formatting (US style or generic)
        const digits = val.replace(/\D/g, '');
        if (digits.length <= 10) {
            // (123) 456-7890
            const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
            if (match) {
                return !match[2] ? match[1] : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
            }
        }
        return val;
    };

    // OTP Timer
    useEffect(() => {
        if (otpTimeLeft > 0) {
            const timer = setTimeout(() => setOtpTimeLeft(otpTimeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [otpTimeLeft]);

    // Abuse Check
    const checkAbuseAndPrepare = async () => {
        if (!validateForm()) return;
        if (!restaurant) return;

        setCheckingAbuse(true);

        try {
            // Mock abuse score calculation or fetch
            // const { count } = await supabase...
            // For now, assume good score unless we implement the count logic fully
            const score = 0; // Mock score

            if (score >= (restaurant.abuse_threshold || 3)) {
                setNeedsOtp(true);
                setOtpSent(false);
            } else {
                setNeedsOtp(false);
                placeOrder(false); // Direct place if no OTP needed
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Verification failed", variant: "destructive" });
        } finally {
            setCheckingAbuse(false);
        }
    };

    const sendOtp = async () => {
        setOtpSent(true);
        setOtpTimeLeft(60);
        toast({ title: "OTP Sent", description: "Code sent to " + phone });
        // In real app, call Supabase Function to send SMS
    };

    const verifyOtp = () => {
        if (otp === "123456") { // Mock OTP
            setOtpVerified(true);
            placeOrder(true);
        } else {
            toast({ title: "Invalid OTP", variant: "destructive" });
        }
    };

    const placeOrder = async (isVerified: boolean) => {
        if (!restaurantId || !tableId) return;
        setIsPlacingOrder(true);

        try {
            const orderData = {
                restaurant_id: restaurantId,
                table_id: tableId,
                table_number: tableNumber, // Added
                customer_name: name,
                customer_phone: phone,
                customer_verified: isVerified,
                order_items: cart, // Supabase handles JSON array automatically if column is jsonb
                total: totalPrice, // Changed from total_price to total
                status: "pending",
                created_at: new Date().toISOString()
            };

            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert(orderData as any) // Casting to any to bypass strict type checking for new columns
                .select()
                .single();

            if (orderError) throw orderError;

            // Lock Table
            await supabase
                .from("tables")
                .update({
                    status: "occupied",
                    current_order_id: order.id
                } as any)
                .eq("id", tableId);

            clearCart();
            toast({ title: "Order Placed!", description: "Kitchen has received your order." });

            navigate(`/menu/${restaurantId}?table=${tableId}&order=${order.id}`);

        } catch (e: any) {
            console.error(e);
            toast({ title: "Order failed", description: e.message || "Please try again", variant: "destructive" });
        } finally {
            setIsPlacingOrder(false);
        }
    };


    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!restaurant) return <div className="p-8 text-center">Restaurant not found</div>;

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="p-4 border-b flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">Checkout</h1>
            </div>

            <div className="container max-w-lg mx-auto p-4 space-y-6">

                {/* Step 1: Location */}
                <Card className={isLocationValid ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : ""}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5" /> Location Check
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLocationChecking ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="animate-spin h-4 w-4" /> Verifying your position...
                            </div>
                        ) : locationError ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span>{locationError}</span>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => checkLocation(restaurant)}>Retry Location</Button>
                            </div>
                        ) : isLocationValid ? (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle className="h-5 w-5" />
                                <span>You are at the restaurant</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-destructive font-medium">You appear to be too far away ({Math.round(distance || 0)}m).</div>
                                <p className="text-sm text-muted-foreground">You must be within {restaurant.location_radius}m to order.</p>
                                <Button size="sm" variant="outline" onClick={() => checkLocation(restaurant)}>Retry Location</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Details */}
                <Card className={!isLocationValid ? "opacity-50 pointer-events-none" : ""}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5" /> Your Details
                        </CardTitle>
                        <CardDescription>Used only for order updates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                placeholder="Your Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className={errors.name ? "border-destructive" : ""}
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Mobile Number</Label>
                            <Input
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={phone}
                                onChange={e => setPhone(formatPhone(e.target.value))}
                                className={errors.phone ? "border-destructive" : ""}
                            />
                            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                        </div>

                        {needsOtp && (
                            <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                                    Verification required due to recent activity history.
                                </div>

                                {!otpSent ? (
                                    <Button className="w-full" onClick={sendOtp}>Send Verification Code</Button>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>Enter 6-digit Code</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={otp}
                                                onChange={e => setOtp(e.target.value)}
                                                maxLength={6}
                                                placeholder="123456"
                                            />
                                            <Button onClick={verifyOtp}>Verify</Button>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Sent to {phone}</span>
                                            {otpTimeLeft > 0 ? (
                                                <span>Resend in {otpTimeLeft}s</span>
                                            ) : (
                                                <button onClick={sendOtp} className="underline hover:text-primary">Resend Code</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 3: Summary */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5" /> Order Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>{restaurant.currency} {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>{restaurant.currency} {totalPrice.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Button
                    className="w-full h-12 text-lg font-bold"
                    size="lg"
                    disabled={!isLocationValid || isPlacingOrder || (needsOtp && !otpVerified)}
                    onClick={() => {
                        if (needsOtp && !otpVerified) return;
                        if (needsOtp && otpVerified) {
                            placeOrder(true);
                        } else {
                            checkAbuseAndPrepare();
                        }
                    }}
                >
                    {isPlacingOrder ? (
                        <><Loader2 className="animate-spin mr-2" /> Placing Order...</>
                    ) : (
                        `Place Order • ${restaurant.currency} ${totalPrice.toFixed(2)}`
                    )}
                </Button>

            </div>
        </div>
    );
};

export default CheckoutPage;
