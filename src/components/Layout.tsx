import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Box, CssBaseline, Drawer, AppBar, Toolbar, useTheme, Alert, Snackbar, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatbotWidget from './ChatbotWidget';
import { RootState, decrementSession, extendSession, logout } from '../store';
import { AnimatePresence, motion } from 'framer-motion';

const drawerWidth = 260;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  
  const { isAuthenticated, sessionTimeout, user } = useSelector((state: RootState) => state.auth);
  const rbac = useSelector((state: RootState) => state.rbac);
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionWarningOpen, setSessionWarningOpen] = useState(false);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Session Timeout Countdown
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      dispatch(decrementSession());
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, dispatch]);

  // Session Warning Dialog
  useEffect(() => {
    if (sessionTimeout <= 60 && sessionTimeout > 0) {
      setSessionWarningOpen(true);
    } else {
      setSessionWarningOpen(false);
    }
  }, [sessionTimeout]);

  // If not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // RBAC Page Check
  const getModuleName = (path: string): string => {
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/orders')) return 'Orders';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/inventory')) return 'Inventory';
    if (path.startsWith('/customers')) return 'Customers';
    if (path.startsWith('/delivery-partners')) return 'Delivery Partners';
    if (path.startsWith('/outlet-management')) return 'Outlet Management';
    if (path.startsWith('/coupons')) return 'Coupons';
    if (path.startsWith('/payments')) return 'Payments';
    if (path.startsWith('/reviews')) return 'Reviews';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/user-management')) return 'User Management';
    if (path.startsWith('/role-permissions')) return 'Role & Permissions';
    if (path.startsWith('/audit-logs')) return 'Audit Logs';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/cms')) return 'CMS';
    return '';
  };

  const moduleName = getModuleName(location.pathname);
  const hasReadPermission = user && moduleName ? rbac[user.role]?.[moduleName]?.read : true;

  if (user && moduleName && !hasReadPermission) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CssBaseline />
        <Navbar onToggleSidebar={handleDrawerToggle} />
        <Sidebar mobileOpen={mobileOpen} onToggleSidebar={handleDrawerToggle} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            mt: 7,
          }}
        >
          <Box sx={{ mt: 4, textAlign: 'center', p: 4 }}>
            <Alert severity="error" variant="filled" sx={{ borderRadius: 3, display: 'inline-flex', textAlign: 'left' }}>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', mb: 1 }}>Access Denied</Typography>
              You do not have permissions to read the <strong>{moduleName}</strong> module. 
              Please contact your administrator or change your simulation role.
            </Alert>
            <Box sx={{ mt: 3 }}>
              <Button component={Link} to="/" variant="contained" color="primary">
                Return to Dashboard
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      
      {/* Header bar */}
      <Navbar onToggleSidebar={handleDrawerToggle} />
      
      {/* Navigation Drawer */}
      <Sidebar mobileOpen={mobileOpen} onToggleSidebar={handleDrawerToggle} />
      
      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 7,
          overflowX: 'hidden'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Session Timeout Dialog */}
      <Dialog open={sessionWarningOpen} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Session Security Alert</DialogTitle>
        <DialogContent>
          <Typography>
            Your admin dashboard session will expire in <strong>{sessionTimeout} seconds</strong> due to inactivity security policy. 
            Would you like to keep working?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => dispatch(logout())} variant="outlined" color="inherit">
            Logout
          </Button>
          <Button onClick={() => dispatch(extendSession())} variant="contained" color="primary">
            Keep Session Active
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin Chatbot */}
      <ChatbotWidget />
    </Box>
  );
};

export default Layout;
