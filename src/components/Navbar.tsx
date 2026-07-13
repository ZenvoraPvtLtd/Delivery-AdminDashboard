import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  AppBar, Toolbar, IconButton, Typography, Box, Select, MenuItem, 
  Menu, Badge, List, ListItem, ListItemText, Button, Tooltip, 
  Avatar, FormControl, Divider, useTheme, Chip, ListItemIcon,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, 
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, InputLabel
} from '@mui/material';
import { 
  Menu as MenuIcon, Bell, Globe, LogOut, CheckCircle2, AlertTriangle,
  ShieldCheck, User, Settings, KeyRound, ScrollText, HelpCircle, RefreshCw
} from 'lucide-react';
import { 
  RootState, setActiveOutlet, markAllNotificationsRead, 
  clearNotifications, loginRequest, addAuditLog, logout, updateUserProfile,
  addNotification
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
  
  const rbac = useSelector((state: RootState) => state.rbac);
  const auditLogs = useSelector((state: RootState) => state.db.auditLogs);

  // Modal states
  const [isSwitchRoleOpen, setIsSwitchRoleOpen] = useState(false);
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isHelpSupportOpen, setIsHelpSupportOpen] = useState(false);

  // Form states
  const [settingsName, setSettingsName] = useState(user?.name || '');
  const [settingsEmail, setSettingsEmail] = useState(user?.email || '');
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportPriority, setSupportPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  useEffect(() => {
    if (user) {
      setSettingsName(user.name);
      setSettingsEmail(user.email);
    }
  }, [user]);

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
    <>
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
                  { icon: RefreshCw,  label: 'Switch Role',       action: () => { setProfileAnchor(null); setIsSwitchRoleOpen(true); } },
                  { icon: User,       label: 'My Profile',        action: () => { setProfileAnchor(null); setIsMyProfileOpen(true); } },
                  { icon: Settings,   label: 'Account Settings',  action: () => { setProfileAnchor(null); setIsAccountSettingsOpen(true); } },
                  { icon: KeyRound,   label: 'Change Password',   action: () => { setProfileAnchor(null); setIsChangePasswordOpen(true); } },
                  { icon: ScrollText, label: 'Activity Log',      action: () => { setProfileAnchor(null); setIsActivityLogOpen(true); } },
                  { icon: HelpCircle, label: 'Help & Support',    action: () => { setProfileAnchor(null); setIsHelpSupportOpen(true); } },
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

    {/* Switch Role Dialog */}
    <Dialog open={isSwitchRoleOpen} onClose={() => setIsSwitchRoleOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 400 } }}>
      <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Simulate User Role</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Switch between dashboard operational profiles to test role-based access controls (RBAC) and permissions.
        </Typography>
        <Grid container spacing={1.5}>
          {[
            'Super Admin', 'Admin', 'Outlet Manager', 'Kitchen Manager', 
            'Delivery Manager', 'Finance Manager', 'Inventory Manager', 
            'Customer Support', 'Marketing Manager'
          ].map((roleOption) => (
            <Grid item xs={12} key={roleOption}>
              <Button 
                fullWidth 
                variant={user?.role === roleOption ? 'contained' : 'outlined'}
                color={user?.role === roleOption ? 'primary' : 'inherit'}
                onClick={() => {
                  handleRoleChange(roleOption as Role);
                  setIsSwitchRoleOpen(false);
                }}
                sx={{ justifyContent: 'space-between', px: 2.5, py: 1.2, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                {roleOption}
                {user?.role === roleOption && <Chip label="Active" size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />}
              </Button>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setIsSwitchRoleOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>

    {/* My Profile Dialog */}
    <Dialog open={isMyProfileOpen} onClose={() => setIsMyProfileOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 480 } }}>
      <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>My Profile Details</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(27,67,50,0.04)', p: 2, borderRadius: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: '1.4rem', fontWeight: 800 }}>
            {user?.name?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>{user?.name}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{user?.email}</Typography>
            <Chip label={user?.role} size="small" color="primary" sx={{ mt: 0.5, fontWeight: 700, borderRadius: 1 }} />
          </Box>
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontFamily: 'Outfit' }}>Role Module Permissions Overview</Typography>
          <TableContainer sx={{ maxHeight: 200, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Read</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Write</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {user && rbac[user.role] && Object.keys(rbac[user.role]).slice(0, 8).map((moduleName) => {
                  const perm = rbac[user.role][moduleName];
                  return (
                    <TableRow key={moduleName}>
                      <TableCell sx={{ fontWeight: 600 }}>{moduleName}</TableCell>
                      <TableCell align="center">{perm.read ? '✅' : '❌'}</TableCell>
                      <TableCell align="center">{perm.create || perm.update ? '✅' : '❌'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setIsMyProfileOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>

    {/* Account Settings Dialog */}
    <Dialog open={isAccountSettingsOpen} onClose={() => setIsAccountSettingsOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 400 } }}>
      <form onSubmit={(e) => {
        e.preventDefault();
        dispatch(updateUserProfile({ name: settingsName, email: settingsEmail }));
        dispatch(addAuditLog({
          username: user?.email || 'Unknown',
          role: user?.role || 'Guest',
          action: `Updated profile settings (Name: ${settingsName}, Email: ${settingsEmail})`,
          module: 'Settings',
          ipAddress: '127.0.0.1',
          browser: 'Admin Console'
        }));
        setIsAccountSettingsOpen(false);
      }}>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Account Settings</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Display Name"
            value={settingsName}
            onChange={(e) => setSettingsName(e.target.value)}
            required
          />
          <TextField
            fullWidth
            size="small"
            type="email"
            label="Email Address"
            value={settingsEmail}
            onChange={(e) => setSettingsEmail(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsAccountSettingsOpen(false)}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">Save Changes</Button>
        </DialogActions>
      </form>
    </Dialog>

    {/* Change Password Dialog */}
    <Dialog open={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 400 } }}>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (passwordNew !== passwordConfirm) {
          alert("New passwords do not match!");
          return;
        }
        dispatch(addAuditLog({
          username: user?.email || 'Unknown',
          role: user?.role || 'Guest',
          action: 'Changed account password successfully',
          module: 'Settings',
          ipAddress: '127.0.0.1',
          browser: 'Admin Console'
        }));
        alert("Password updated successfully!");
        setPasswordCurrent('');
        setPasswordNew('');
        setPasswordConfirm('');
        setIsChangePasswordOpen(false);
      }}>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Change Password</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            type="password"
            label="Current Password"
            value={passwordCurrent}
            onChange={(e) => setPasswordCurrent(e.target.value)}
            required
          />
          <TextField
            fullWidth
            size="small"
            type="password"
            label="New Password"
            value={passwordNew}
            onChange={(e) => setPasswordNew(e.target.value)}
            required
          />
          <TextField
            fullWidth
            size="small"
            type="password"
            label="Confirm New Password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">Update Password</Button>
        </DialogActions>
      </form>
    </Dialog>

    {/* Activity Log Dialog */}
    <Dialog open={isActivityLogOpen} onClose={() => setIsActivityLogOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 550 } }}>
      <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Activity Logs</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          List of recent administrative actions tracked for your operator profile.
        </Typography>
        <TableContainer sx={{ maxHeight: 300, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs
                .filter(log => log.username.toLowerCase() === user?.email.toLowerCase())
                .map((log) => (
                  <TableRow key={log.id}>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{log.action}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{log.module}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setIsActivityLogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>

    {/* Help & Support Dialog */}
    <Dialog open={isHelpSupportOpen} onClose={() => setIsHelpSupportOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 450 } }}>
      <form onSubmit={(e) => {
        e.preventDefault();
        dispatch(addNotification({
          title: 'Support Ticket Submitted',
          description: `Subject: "${supportSubject}". Our support reps will respond shortly.`,
          type: 'ticket'
        }));
        dispatch(addAuditLog({
          username: user?.email || 'Unknown',
          role: user?.role || 'Guest',
          action: `Submitted support ticket: "${supportSubject}"`,
          module: 'CMS',
          ipAddress: '127.0.0.1',
          browser: 'Admin Console'
        }));
        alert("Support ticket submitted! Ticket reference number has been sent to notification box.");
        setSupportSubject('');
        setSupportMessage('');
        setIsHelpSupportOpen(false);
      }}>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Delivo Admin Help desk</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Box sx={{ bgcolor: 'rgba(27,67,50,0.04)', p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Need Immediate Assistance?</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Call support at <strong>+1-800-555-DELI</strong> or email <strong>support@delivo.com</strong>.</Typography>
          </Box>
          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Open a Support Ticket</Typography>
          <TextField
            fullWidth
            size="small"
            label="Subject / Topic"
            value={supportSubject}
            onChange={(e) => setSupportSubject(e.target.value)}
            required
          />
          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            label="Detailed description"
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            required
          />
          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select
              value={supportPriority}
              label="Priority"
              onChange={(e) => setSupportPriority(e.target.value as 'Low' | 'Medium' | 'High')}
            >
              <MenuItem value="Low">Low Priority</MenuItem>
              <MenuItem value="Medium">Medium Priority</MenuItem>
              <MenuItem value="High">High Priority</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsHelpSupportOpen(false)}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">Submit Ticket</Button>
        </DialogActions>
      </form>
    </Dialog>
  </>
);
};

export default Navbar;
