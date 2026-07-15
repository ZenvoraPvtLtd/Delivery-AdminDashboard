import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { RootState } from './store';
import { getTheme } from './theme';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import DeliveryPartners from './pages/DeliveryPartners';
import OutletManagement from './pages/OutletManagement';
import CouponsOffers from './pages/CouponsOffers';
import PaymentsWallet from './pages/PaymentsWallet';
import ReviewsComplaints from './pages/ReviewsComplaints';
import ReportsAnalytics from './pages/ReportsAnalytics';
import BannerCMS from './pages/BannerCMS';
import UserManagement from './pages/UserManagement';
import RolePermissions from './pages/RolePermissions';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import OrderConfirmationCenter from './pages/OrderConfirmationCenter';
import CommunicationSettings from './pages/CommunicationSettings';

const App: React.FC = () => {
  const mode = useSelector((state: RootState) => state.ui.mode);
  const theme = getTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard shell routes */}
        <Route 
          path="/*" 
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/products" element={<Products />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/delivery-partners" element={<DeliveryPartners />} />
                <Route path="/outlet-management" element={<OutletManagement />} />
                <Route path="/coupons" element={<CouponsOffers />} />
                <Route path="/payments" element={<PaymentsWallet />} />
                <Route path="/reviews-complaints" element={<ReviewsComplaints />} />
                <Route path="/reports-analytics" element={<ReportsAnalytics />} />
                <Route path="/banner-cms" element={<BannerCMS />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/role-permissions" element={<RolePermissions />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/confirmation-center" element={<OrderConfirmationCenter />} />
                <Route path="/settings/communication" element={<CommunicationSettings />} />
                {/* Fallback to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          } 
        />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
