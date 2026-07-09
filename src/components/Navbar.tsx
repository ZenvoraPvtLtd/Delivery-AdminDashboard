import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  AppBar, Toolbar, IconButton, Typography, Box, Select, MenuItem, 
  Menu, Badge, List, ListItem, ListItemText, Button, Tooltip, 
  Avatar, FormControl, InputLabel, Divider, useTheme
} from '@mui/material';
import { 
  Menu as MenuIcon, Bell, Search, Globe, LogOut, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { 
  RootState, setActiveOutlet, markAllNotificationsRead, 
  clearNotifications, loginRequest, addAuditLog 
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
      <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 2, justifyContent: 'space-between' }}>
        
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
              <MenuItem value="Super Admin">Super Admin</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Outlet Manager">Outlet Manager</MenuItem>
              <MenuItem value="Kitchen Manager">Kitchen Manager</MenuItem>
              <MenuItem value="Delivery Manager">Delivery Manager</MenuItem>
              <MenuItem value="Finance Manager">Finance Manager</MenuItem>
              <MenuItem value="Inventory Manager">Inventory Manager</MenuItem>
              <MenuItem value="Customer Support">Customer Support</MenuItem>
              <MenuItem value="Marketing Manager">Marketing Manager</MenuItem>
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

          {/* User Profile Avatar dropdown */}
          <Tooltip title="Profile Account">
            <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)} sx={{ p: 0 }}>
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
                {user?.name.charAt(0) || 'A'}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            PaperProps={{ sx: { width: 220, mt: 1.5, borderRadius: 3 } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user?.name}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setProfileAnchor(null); handleRoleChange('Super Admin'); }}>
              Reset to Super Admin
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setProfileAnchor(null); dispatch(loginRequest({ email: user?.email || '', name: user?.name || '', role: user?.role || 'Super Admin', rememberMe: false })); }}>
              Simulate 2FA Lock
            </MenuItem>
          </Menu>

        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
