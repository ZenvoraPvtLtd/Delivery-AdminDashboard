import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  AppBar, Toolbar, IconButton, Typography, Box, Select, MenuItem, 
  Menu, Badge, List, ListItem, ListItemText, Button, Tooltip, 
  Avatar, FormControl, Divider, useTheme, Chip, ListItemIcon
} from '@mui/material';
import { 
  Menu as MenuIcon, Bell, Globe, LogOut, CheckCircle2, AlertTriangle,
  ShieldCheck, User, Settings, KeyRound, ScrollText, HelpCircle, RefreshCw
} from 'lucide-react';
import { 
  RootState, setActiveOutlet, markAllNotificationsRead, 
  clearNotifications, loginRequest, addAuditLog, logout 
} from '../store';
import { Role } from '../store';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const { mode, activeOutletId, notifications } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);
  const outlets = useSelector((state: RootState) => state.db.outlets);

  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    dispatch(addAuditLog({
      username: user?.email || 'Unknown',
      role: user?.role || 'Guest',
      action: 'User logged out of admin panel',
      module: 'Auth',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
    dispatch(logout());
  };

  const handleRoleChange = (newRole: Role) => {
    dispatch(loginRequest({
      email: `${newRole.toLowerCase().replace(/\s/g, '')}@delivo.com`,
      name: `Demo ${newRole}`,
      role: newRole,
      rememberMe: true
    }));
    
    // Add audit log for simulation
    dispatch(addAuditLog({
      username: 'Simulator Client',
      role: 'Super Admin',
      action: `Simulated role changed to ${newRole}`,
      module: 'RBAC',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'stock': return <AlertTriangle size={18} color={theme.palette.error.main} />;
      case 'order': return <CheckCircle2 size={18} color={theme.palette.success.main} />;
      default: return <Bell size={18} color={theme.palette.info.main} />;
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ px: { xs: 1.5, md: 2 }, gap: 1.5, minHeight: '56px !important', height: 56, justifyContent: 'space-between' }}>
        
        {/* Left Side: Mobile Menu Button & Global Search placeholder */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onToggleSidebar}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon size={20} />
          </IconButton>
          
          {/* Global Outlet Select */}
          <FormControl size="small" sx={{ minWidth: { xs: 130, sm: 220 } }}>
            <Select
              value={activeOutletId}
              onChange={(e) => dispatch(setActiveOutlet(e.target.value))}
              displayEmpty
              sx={{ 
                borderRadius: 2, 
                height: 38,
                bgcolor: 'rgba(27, 67, 50, 0.04)',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Globe size={15} /> All Outlets
                </Box>
              </MenuItem>
              {outlets.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Right Side Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
          
          {/* Demo Role Quick Switcher (Super Handy for reviewing RBAC!) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px dashed rgba(27, 67, 50, 0.25)', p: 0.5, borderRadius: 2, px: 1 }}>
            <ShieldCheck size={16} style={{ color: theme.palette.primary.main }} />
            <Typography variant="caption" sx={{ display: { xs: 'none', lg: 'block' }, color: 'text.secondary', fontWeight: 600 }}>
              SIMULATE ROLE:
            </Typography>
            <Select
              size="small"
              value={user?.role || 'Super Admin'}
              onChange={(e) => handleRoleChange(e.target.value as Role)}
              sx={{ 
                height: 28, 
                fontSize: '0.75rem', 
                fontWeight: 700,
                color: 'primary.main',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' } 
              }}
            >
              {(() => {
                const currentRole = user?.role || 'Super Admin';
                const hasFullAccess = currentRole === 'Super Admin' || currentRole === 'Admin';
                const rolesList = [
                  'Super Admin', 'Admin', 'Outlet Manager', 'Kitchen Manager', 
                  'Delivery Manager', 'Finance Manager', 'Inventory Manager', 
                  'Customer Support', 'Marketing Manager'
                ];
                
                // If Super Admin/Admin, show all options. Otherwise, show only the current individual role.
                const visibleRoles = hasFullAccess ? rolesList : [currentRole];
                
                return visibleRoles.map(r => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ));
              })()}
            </Select>
          </Box>

          {/* Notifications Center */}
          <IconButton 
            color="inherit" 
            onClick={(e) => setNotifAnchor(e.currentTarget)}
            sx={{ width: 38, height: 38 }}
          >
            <Badge badgeContent={unreadNotifs} color="error" max={9}>
              <Bell size={20} />
            </Badge>
          </IconButton>


          
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            PaperProps={{
              sx: { width: 320, maxHeight: 400, mt: 1.5, borderRadius: 3, p: 0 }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Alert Notifications</Typography>
              {unreadNotifs > 0 && (
                <Button size="small" onClick={() => dispatch(markAllNotificationsRead())} sx={{ fontSize: '0.75rem' }}>
                  Mark all read
                </Button>
              )}
            </Box>
            <Divider />
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No active notifications</Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {notifications.map((notif) => (
                  <ListItem 
                    key={notif.id}
                    sx={{ 
                      py: 1.5,
                      alignItems: 'flex-start',
                      gap: 1.5,
                      bgcolor: notif.read ? 'transparent' : 'rgba(27, 67, 50, 0.04)'
                    }}
                  >
                    <Box sx={{ mt: 0.5 }}>
                      {getNotifIcon(notif.type)}
                    </Box>
                    <ListItemText
                      primary={notif.title}
                      secondary={notif.description}
                      primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: notif.read ? 600 : 700 }}
                      secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
              <Button size="small" color="inherit" onClick={() => dispatch(clearNotifications())} sx={{ fontSize: '0.75rem' }}>
                Clear All
              </Button>
            </Box>
          </Menu>

          {/* User Profile Avatar dropdown — with online indicator */}
          <Tooltip title="Profile">
            <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)} sx={{ p: 0, position: 'relative' }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 36,
                  height: 36,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {user?.name?.charAt(0) || 'A'}
              </Avatar>
              {/* Online dot */}
              <Box sx={{
                position: 'absolute', bottom: 1, right: 1,
                width: 9, height: 9, borderRadius: '50%',
                bgcolor: '#22c55e', border: '1.5px solid white'
              }} />
            </IconButton>
          </Tooltip>

          {/* Profile Dropdown Menu */}
          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            PaperProps={{
              sx: {
                width: 240,
                mt: 1.5,
                borderRadius: 3,
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                overflow: 'hidden'
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* Profile Header */}
            <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 46,
                    height: 46,
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(27,67,50,0.2)'
                  }}
                >
                  {user?.name?.charAt(0) || 'A'}
                </Avatar>
                <Box sx={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 11, height: 11, borderRadius: '50%',
                  bgcolor: '#22c55e', border: '2px solid white'
                }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '0.95rem', color: '#1A1A1A', lineHeight: 1.2 }}>
                  {user?.name || 'Admin User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block', mt: 0.25 }}>
                  {user?.email || 'admin@delivo.com'}
                </Typography>
                <Chip
                  label={(user?.role || 'Super Admin').toUpperCase()}
                  size="small"
                  sx={{
                    mt: 0.6,
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    bgcolor: 'rgba(59, 130, 246, 0.12)',
                    color: '#2563EB',
                    borderRadius: '4px',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ mx: 0 }} />

            {/* Menu Items — role-based */}
            <Box sx={{ py: 1 }}>
              {(() => {
                const role = user?.role || 'Super Admin';

                // Full list of all options
                const ALL_ITEMS = [
                  { icon: RefreshCw,  label: 'Switch Role',       action: () => { setProfileAnchor(null); handleRoleChange('Super Admin'); } },
                  { icon: User,       label: 'My Profile',        action: () => setProfileAnchor(null) },
                  { icon: Settings,   label: 'Account Settings',  action: () => setProfileAnchor(null) },
                  { icon: KeyRound,   label: 'Change Password',   action: () => setProfileAnchor(null) },
                  { icon: ScrollText, label: 'Activity Log',      action: () => setProfileAnchor(null) },
                  { icon: HelpCircle, label: 'Help & Support',    action: () => setProfileAnchor(null) },
                ];

                // Individual options per role
                const ROLE_ITEMS: Record<string, string[]> = {
                  'Outlet Manager':    ['My Profile', 'Account Settings', 'Change Password', 'Help & Support'],
                  'Kitchen Manager':   ['My Profile', 'Change Password', 'Help & Support'],
                  'Delivery Manager':  ['My Profile', 'Change Password', 'Help & Support'],
                  'Finance Manager':   ['My Profile', 'Account Settings', 'Change Password', 'Activity Log', 'Help & Support'],
                  'Inventory Manager': ['My Profile', 'Change Password', 'Help & Support'],
                  'Customer Support':  ['My Profile', 'Change Password', 'Activity Log', 'Help & Support'],
                  'Marketing Manager': ['My Profile', 'Account Settings', 'Change Password', 'Help & Support'],
                };

                const isFullAccess = role === 'Super Admin' || role === 'Admin';
                const allowed = isFullAccess ? ALL_ITEMS : ALL_ITEMS.filter(item => (ROLE_ITEMS[role] || ['My Profile', 'Change Password', 'Help & Support']).includes(item.label));

                return allowed.map(({ icon: Icon, label, action }) => (
                  <MenuItem
                    key={label}
                    onClick={action}
                    sx={{
                      px: 2.5,
                      py: 1,
                      gap: 1.5,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'text.primary',
                      '&:hover': { bgcolor: 'rgba(27, 67, 50, 0.05)' },
                      transition: 'background 0.15s'
                    }}
                  >
                    <Icon size={16} style={{ color: '#6B6B6B', flexShrink: 0 }} />
                    {label}
                  </MenuItem>
                ));
              })()}
            </Box>

            <Divider sx={{ mx: 0 }} />

            {/* Logout */}
            <Box sx={{ py: 1 }}>
              <MenuItem
                onClick={() => { setProfileAnchor(null); handleLogout(); }}
                sx={{
                  px: 2.5,
                  py: 1,
                  gap: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'error.main',
                  '&:hover': { bgcolor: 'rgba(155, 44, 44, 0.06)' },
                  transition: 'background 0.15s'
                }}
              >
                <LogOut size={16} style={{ flexShrink: 0 }} />
                Logout
              </MenuItem>
            </Box>
          </Menu>

        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
