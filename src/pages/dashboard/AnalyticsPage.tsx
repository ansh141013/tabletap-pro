import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeature, usePlan } from "@/contexts/PlanContext";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { format, startOfDay, endOfDay, isSameDay, parseISO, getHours } from "date-fns";
import { getRestaurant } from "@/services/firebaseService";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/config/firebase";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Grid3X3,
    Calendar,
    Download,
    ArrowUpRight,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import { Order } from "@/types/models";

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#06B6D4', '#F97316', '#EF4444', '#9CA3AF'];

export const AnalyticsPage = () => {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
    });
    const [activeTab, setActiveTab] = useState("overview");

    // Feature Check
    const hasAnalytics = useFeature("analytics");
    const hasAdvancedAnalytics = useFeature("advancedAnalytics");
    const navigate = useNavigate();
    const { planConfig } = usePlan();

    // If no basic analytics, show upgrade wall immediately
    if (!hasAnalytics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center p-8">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2 max-w-lg">
                    <h2 className="text-2xl font-bold">Analytics Locked</h2>
                    <p className="text-muted-foreground">
                        Upgrade to the Pro plan to unlock detailed insights, revenue tracking, and order trends.
                    </p>
                </div>
                <Button size="lg" onClick={() => navigate('/dashboard/upgrade')}>
                    View Plans & Upgrade
                </Button>
            </div>
        );
    }

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!userProfile?.restaurantId || !dateRange?.from) return;

            setLoading(true);
            try {
                // 1. Get Restaurant (needed for currency, though we ignore for now to keep it simple or fetch if needed)
                // const restaurant = await getRestaurant(userProfile.restaurantId);

                // 2. Fetch Orders
                // We use direct Firestore query here as analytics might need specific range queries not in generic service
                const ordersRef = collection(db, 'orders');
                let q = query(
                    ordersRef,
                    where("restaurantId", "==", userProfile.restaurantId),
                    where("createdAt", ">=", dateRange.from.toISOString())
                );

                if (dateRange.to) {
                    q = query(q, where("createdAt", "<=", endOfDay(dateRange.to).toISOString()));
                }

                // Note: Compound queries with range filters on different fields or multiple fields require indexes.
                // restaurantId + createdAt index is needed.

                const snap = await getDocs(q);
                const ordersData = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Order));

                // Sort by date desc
                ordersData.sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                    return dateB - dateA;
                });

                setOrders(ordersData);

            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userProfile, dateRange]);

    // --- Metrics Calculations ---

    const metrics = useMemo(() => {
        const totalOrders = orders.length;
        // const completedOrders = orders.filter(o => ['served', 'completed'].includes(o.status));

        // Revenue (only from accepted/served/completed)
        const revenueOrders = orders.filter(o => ['accepted', 'preparing', 'ready', 'served', 'completed'].includes(o.status));
        const totalRevenue = revenueOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        const finalAov = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

        const activeTableSet = new Set(
            orders
                .filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status))
                .map(o => o.tableNumber)
        );

        return {
            totalOrders,
            totalRevenue,
            avgOrderValue: finalAov,
            activeTables: activeTableSet.size
        };
    }, [orders]);

    // --- Chart Data Preparation ---

    const hourlyData = useMemo(() => {
        const groups: Record<number, number> = {};
        for (let i = 0; i < 24; i++) groups[i] = 0;

        orders.forEach(order => {
            const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            const hour = getHours(date);
            groups[hour]++;
        });

        return Object.entries(groups).map(([hour, count]) => ({
            name: `${hour}:00`,
            orders: count
        }));
    }, [orders]);

    const salesTrendData = useMemo(() => {
        const isSingleDay = dateRange?.from && dateRange?.to && isSameDay(dateRange.from, dateRange.to);
        const groups: Record<string, { revenue: number, orders: number }> = {};

        orders.forEach(order => {
            const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            const key = isSingleDay
                ? format(date, "HH:00")
                : format(date, "MMM dd");

            if (!groups[key]) groups[key] = { revenue: 0, orders: 0 };

            if (['accepted', 'preparing', 'ready', 'served', 'completed'].includes(order.status)) {
                groups[key].revenue += order.total || 0;
            }
            groups[key].orders += 1;
        });

        return Object.entries(groups).map(([name, data]) => ({
            name,
            revenue: data.revenue,
            orders: data.orders
        }));
    }, [orders, dateRange]);

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        const statuses = ['served', 'ready', 'preparing', 'accepted', 'pending', 'cancelled', 'auto_cancelled'];

        statuses.forEach(s => counts[s] = 0);

        orders.forEach(o => {
            const s = o.status || 'unknown';
            counts[s] = (counts[s] || 0) + 1;
        });

        return Object.entries(counts)
            .filter(([_, value]) => value > 0)
            .map(([name, value]) => ({ name, value }));
    }, [orders]);

    const topItems = useMemo(() => {
        const itemMap: Record<string, { id: string; name: string; quantity: number; revenue: number }> = {};

        orders.forEach(order => {
            if (['accepted', 'preparing', 'ready', 'served', 'completed'].includes(order.status)) {
                const items = order.items || [];
                items.forEach((item: any) => {
                    // item.itemId is the ID ref
                    const id = item.itemId || item.name;
                    if (!itemMap[id]) {
                        itemMap[id] = {
                            id,
                            name: item.name,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    const qty = item.quantity || 1;
                    const price = item.price || 0;
                    itemMap[id].quantity += qty;
                    itemMap[id].revenue += (qty * price);
                });
            }
        });

        return Object.values(itemMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
    }, [orders]);

    const handleExport = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Restaurant Analytics Report", 20, 20);

        doc.setFontSize(12);
        doc.text(`Generated on: ${format(new Date(), "PPpp")}`, 20, 30);
        if (dateRange?.from) {
            doc.text(`Period: ${format(dateRange.from, "PP")} - ${dateRange.to ? format(dateRange.to, "PP") : "Ongoing"}`, 20, 40);
        }

        doc.setFontSize(14);
        doc.text("Key Metrics", 20, 55);
        doc.setFontSize(12);
        doc.text(`Total Revenue: $${metrics.totalRevenue.toLocaleString()}`, 20, 65);
        doc.text(`Total Orders: ${metrics.totalOrders}`, 20, 75);
        doc.text(`Avg Order Value: $${metrics.avgOrderValue.toFixed(2)}`, 20, 85);

        doc.text("Top Selling Items", 20, 100);
        let y = 110;
        topItems.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.name} - ${item.quantity} sold ($${item.revenue.toFixed(2)})`, 20, y);
            y += 10;
        });

        doc.save("analytics-report.pdf");
    };

    if (loading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                    <p className="text-muted-foreground">
                        Overview of your restaurant's performance
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[260px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <CalendarComponent
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <span className="text-green-500 font-medium flex items-center">
                                <ArrowUpRight className="h-3 w-3" /> +0.0%
                            </span>
                            from previous period
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalOrders}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <span className="text-green-500 font-medium flex items-center">
                                <ArrowUpRight className="h-3 w-3" /> +0.0%
                            </span>
                            from previous period
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${metrics.avgOrderValue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <span className="text-green-500 font-medium flex items-center">
                                <ArrowUpRight className="h-3 w-3" /> +0.0%
                            </span>
                            from previous period
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
                        <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.activeTables}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Currently occupied
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="items">Top Items</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Revenue / Orders Chart */}
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Revenue Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={salesTrendData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Status Breakdown */}
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Order Status</CardTitle>
                                <CardDescription>Distribution of order statuses</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Advanced Analytics Upgrade Prompt inside Overview Tab if needed */}
                    {!hasAdvancedAnalytics && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
                            <Card className="col-span-full bg-gradient-to-r from-primary/5 via-background to-background border-dashed border-primary/20">
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <TrendingUp className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Unlock Advanced Insights</h3>
                                            <p className="text-muted-foreground text-sm">
                                                Get items breakdown, customer retention, and export capabilities with Business plan.
                                            </p>
                                        </div>
                                    </div>
                                    <Button onClick={() => navigate('/dashboard/upgrade')}>Upgrade Now</Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Recent Orders List (Simplified) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {orders.slice(0, 5).map(order => (
                                    <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="font-medium">Order #{order.id!.slice(0, 6)}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {format(order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt), "HH:mm")} • Table {order.tableNumber}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant="outline" className="capitalize">{order.status}</Badge>
                                            <span className="font-bold">${order.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                                {orders.length === 0 && <div className="text-center text-muted-foreground py-4">No recent orders</div>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="items" className="space-y-4">
                    {!hasAdvancedAnalytics ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-card border rounded-lg border-dashed">
                            <Lock className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Advanced Analytics Required</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm text-center">
                                Detailed item performance analysis is available on the Business plan.
                            </p>
                            <Button onClick={() => navigate('/dashboard/upgrade')}>Upgrade to Unlock</Button>
                        </div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Selling Items</CardTitle>
                                <CardDescription>Your most popular menu items</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {topItems.map((item, index) => (
                                        <div key={item.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                                                    #{index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">{item.quantity} orders</p>
                                                </div>
                                            </div>
                                            <span className="font-bold">
                                                ${item.revenue.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                    {topItems.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No sales data available for this period.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                    )}
                </TabsContent>

                <TabsContent value="customers" className="space-y-4">
                    {!hasAdvancedAnalytics ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-card border rounded-lg border-dashed">
                            <Lock className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Business Plan Required</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm text-center">
                                Customer insights and retention metrics are available for high-volume restaurants.
                            </p>
                            <Button onClick={() => navigate('/dashboard/upgrade')}>Upgrade to Business</Button>
                        </div>
                    ) : (
                        <Card>
                            <CardHeader><CardTitle>Customer Insights</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">Customer tracking requires order history. Feature coming soon...</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div >
    );
};

export default AnalyticsPage;
