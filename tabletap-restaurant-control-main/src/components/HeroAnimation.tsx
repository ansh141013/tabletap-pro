import { useEffect, useState } from "react";

interface OrderCard {
  id: number;
  table: string;
  items: string[];
  status: "New" | "Preparing" | "Served";
}

const initialOrders: OrderCard[] = [
  { id: 1, table: "Table 4", items: ["Pasta Carbonara", "Caesar Salad"], status: "New" },
  { id: 2, table: "Table 7", items: ["Grilled Salmon", "House Wine"], status: "Preparing" },
  { id: 3, table: "Table 2", items: ["Margherita Pizza"], status: "Served" },
];

const HeroAnimation = () => {
  const [orders, setOrders] = useState<OrderCard[]>(initialOrders);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(prev => prev.map(order => {
        if (order.status === "New") return { ...order, status: "Preparing" };
        if (order.status === "Preparing") return { ...order, status: "Served" };
        return { ...order, status: "New" };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Preparing": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Served": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px]">
      {/* Dashboard Container */}
      <div className="absolute inset-0 bg-surface-elevated rounded-3xl shadow-elevated border border-border/50 overflow-hidden">
        {/* Dashboard Header */}
        <div className="bg-surface border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="text-sm font-medium text-muted-foreground">Live Orders Dashboard</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft"></div>
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-surface rounded-xl p-4 border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Active Tables</p>
              <p className="text-2xl font-bold text-foreground">12</p>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Orders Today</p>
              <p className="text-2xl font-bold text-foreground">47</p>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Avg. Time</p>
              <p className="text-2xl font-bold text-foreground">12m</p>
            </div>
          </div>

          {/* Order Cards */}
          <div className="space-y-3">
            {orders.map((order, index) => (
              <div
                key={order.id}
                className={`bg-background rounded-xl p-4 border border-border/50 shadow-sm transition-all duration-500 animate-slide-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-primary font-semibold text-xs">{order.table.split(' ')[1]}</span>
                    </div>
                    <span className="font-medium text-foreground text-sm">{order.table}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-500 ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="pl-10">
                  <p className="text-sm text-muted-foreground">
                    {order.items.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Table Indicator */}
      <div className="absolute -bottom-4 -left-4 bg-background rounded-2xl p-4 shadow-elevated border border-border/50 animate-float-slow">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-sm ${
                  i <= 3 ? "bg-primary" : "bg-border"
                }`}
              ></div>
            ))}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tables</p>
            <p className="text-sm font-semibold text-foreground">3/6 Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroAnimation;
