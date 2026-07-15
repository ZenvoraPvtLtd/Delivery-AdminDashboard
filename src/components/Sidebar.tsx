import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, IconButton, Chip } from '@mui/material';
import { 
  LayoutDashboard, ShoppingBag, Utensils, ClipboardList, Package, Users, 
  Bike, Store, Percent, Gift, CreditCard, Wallet, Star, AlertTriangle, 
  FileText, BarChart3, Bell, Image, FileSignature, ShieldAlert, History, 
  Settings, Key, Database, LogOut, ChevronLeft, Sliders, ClipboardCheck
} from 'lucide-react';
import { RootState, logout } from '../store';

const drawerWidth = 260;

interface SidebarProps {
  mobileOpen: boolean;
  onToggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onToggleSidebar }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const rbac = useSelector((state: RootState) => state.rbac);
  const { mode } = useSelector((state: RootState) => state.ui);

  const activeOrdersCount = useSelector((state: RootState) => 
    state.db.orders.filter(o => ['Pending', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status)).length
  );
  
  const lowStockCount = useSelector((state: RootState) => 
    state.db.rawMaterials.filter(m => m.stock < m.minStockAlert).length
  );

  const openTicketsCount = useSelector((state: RootState) => 
    state.db.tickets.filter(t => t.status === 'Open').length
  );

  // Core sidebar menu navigation nodes mapped to permission modules
  const menuItems = [
    { text: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', module: 'Dashboard' },
    { text: 'Orders', icon: ShoppingBag, path: '/orders', module: 'Orders', badge: activeOrdersCount, badgeColor: 'primary' },
    { text: 'Products', icon: Utensils, path: '/products', module: 'Products' },
    { text: 'Inventory', icon: ClipboardList, path: '/inventory', module: 'Inventory', badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'error' },
    { text: 'Customers', icon: Users, path: '/customers', module: 'Customers' },
    { text: 'Delivery Partners', icon: Bike, path: '/delivery-partners', module: 'Delivery Partners' },
    { text: 'Outlet Management', icon: Store, path: '/outlet-management', module: 'Outlet Management' },
    { text: 'Coupons & Offers', icon: Percent, path: '/coupons', module: 'Coupons' },
    { text: 'Payments & Wallet', icon: CreditCard, path: '/payments', module: 'Payments' },
    { text: 'Reviews & Feedback', icon: Star, path: '/reviews-complaints', module: 'Reviews', badge: openTicketsCount > 0 ? openTicketsCount : undefined, badgeColor: 'warning' },
    { text: 'Reports & Analytics', icon: BarChart3, path: '/reports-analytics', module: 'Reports' },
    { text: 'Banner & CMS', icon: Image, path: '/banner-cms', module: 'Banner Management' },
    { text: 'Confirmation Desk', icon: ClipboardCheck, path: '/confirmation-center', module: 'Orders' },
    { text: 'User Management', icon: Users, path: '/user-management', module: 'User Management' },
    { text: 'Role & Permissions', icon: ShieldAlert, path: '/role-permissions', module: 'Role & Permissions' },
    { text: 'Audit Logs', icon: History, path: '/audit-logs', module: 'Audit Logs' },
    { text: 'Settings & APIs', icon: Settings, path: '/settings', module: 'Settings' },
    { text: 'Communication Config', icon: Sliders, path: '/settings/communication', module: 'Settings' }
  ];

  // Helper to filter menu based on role permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return false;
    const permissions = rbac[user.role];
    return permissions?.[item.module]?.read !== false;
  });

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ 
            width: 34, 
            height: 34, 
            borderRadius: 2, 
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(27, 67, 50, 0.25)'
          }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, fontFamily: 'Outfit' }}>D</Typography>
          </Box>
          <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
            Delivo<Typography component="span" variant="h5" sx={{ color: 'primary.main', fontWeight: 800, fontFamily: 'Outfit' }}>Admin</Typography>
          </Typography>
        </Box>
        <IconButton sx={{ display: { md: 'none' } }} onClick={onToggleSidebar}>
          <ChevronLeft />
        </IconButton>
      </Box>

      <Divider />

      {/* User Role Quick Tag */}
      <Box sx={{ p: 2, px: 3, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Logged in as
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>
          {user?.name || 'Simulator User'}
        </Typography>
        <Chip 
          label={user?.role || 'Guest'} 
          color="primary" 
          size="small" 
          variant="outlined"
          sx={{ 
            mt: 1, 
            fontWeight: 600, 
            fontSize: '0.7rem', 
            borderRadius: '6px',
            maxWidth: 'fit-content',
            borderColor: 'primary.main',
            color: 'primary.main',
            bgcolor: 'rgba(27, 67, 50, 0.04)'
          }} 
        />
      </Box>

      <Divider />

      {/* Menu List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 1 }}>
        <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  component={Link} 
                  to={item.path}
                  onClick={() => mobileOpen && onToggleSidebar()}
                  selected={isSelected}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    px: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(27, 67, 50, 0.08)',
                      color: 'primary.main',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'rgba(27, 67, 50, 0.12)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main'
                      }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                    <Icon size={18} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontSize: '0.875rem', 
                      fontWeight: isSelected ? 600 : 500 
                    }} 
                  />
                  {item.badge !== undefined && (
                    <Chip 
                      label={item.badge} 
                      size="small" 
                      color={item.badgeColor as any || 'default'} 
                      sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} 
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>


    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onToggleSidebar}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
