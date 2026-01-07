import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OrdersPage } from "@/pages/dashboard/OrdersPage";
import { TablesPage } from "@/pages/dashboard/TablesPage";
import { MenuPage } from "@/pages/dashboard/MenuPage";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";
import { WaiterCallsPage } from "@/pages/dashboard/WaiterCallsPage";

const Dashboard = () => {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<OrdersPage />} />
        <Route path="orders" element={<Navigate to="/dashboard" replace />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="calls" element={<WaiterCallsPage />} />
      </Route>
    </Routes>
  );
};

export default Dashboard;
