import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, FormControl, InputLabel, Select, MenuItem, useTheme, IconButton
} from '@mui/material';
import { Users, Plus, ShieldCheck, Trash2, KeyRound, Store, Eye } from 'lucide-react';
import { RootState, addAuditLog, addNotification } from '../store';
import { Role } from '../store';

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const outlets = useSelector((state: RootState) => state.db.outlets);

  const [addOpen, setAddOpen] = useState(false);
  
  // Profile view states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleViewProfile = (u: any) => {
    setSelectedUser(u);
    setIsProfileOpen(true);
  };
  
  // Local simulated admin users list
  const [users, setUsers] = useState([
    { id: 'usr-1', name: 'Super Admin', email: 'superadmin@delivo.com', role: 'Super Admin', outlet: 'All Outlets', lastActive: 'Active now' },
    { id: 'usr-2', name: 'Sarah Jenkins', email: 'sarah.j@delivo.com', role: 'Outlet Manager', outlet: 'Downtown Central Outlet', lastActive: '2 hours ago' },
    { id: 'usr-3', name: 'Chef Sarah', email: 'sarah.chef@delivo.com', role: 'Kitchen Manager', outlet: 'Downtown Central Outlet', lastActive: '5 mins ago' },
    { id: 'usr-4', name: 'Rider Controller', email: 'delivery.manager@delivo.com', role: 'Delivery Manager', outlet: 'All Outlets', lastActive: '1 day ago' }
  ]);

  // Form states
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uRole, setURole] = useState<Role>('Outlet Manager');
  const [uOutlet, setUOutlet] = useState('all');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uName || !uEmail) return;

    const targetOutletName = uOutlet === 'all' ? 'All Outlets' : outlets.find(o => o.id === uOutlet)?.name || 'All Outlets';

    const newUser = {
      id: `usr-${Date.now().toString().slice(-3)}`,
      name: uName,
      email: uEmail,
      role: uRole,
      outlet: targetOutletName,
      lastActive: 'Never logged in'
    };

    setUsers([...users, newUser]);

    dispatch(addNotification({
      title: 'Admin User Registered',
      description: `Registered ${uName} as ${uRole} profile.`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Created admin user account: ${uEmail} with role ${uRole}`,
      module: 'User Management',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    setAddOpen(false);
    setUName('');
    setUEmail('');
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Remove admin account for "${name}"?`)) {
      setUsers(users.filter(u => u.id !== id));

      dispatch(addNotification({
        title: 'User Access Revoked',
        description: `Revoked dashboard access for ${name}.`,
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: `Deleted admin account for ${name} (ID: ${id})`,
        module: 'User Management',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));
    }
  };

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            User Account Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Create administrative accounts, assign operational branch mappings, and monitor access sessions
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setAddOpen(true)}
          startIcon={<Plus size={16} />}
          sx={{ borderRadius: 2 }}
        >
          Create User account
        </Button>
      </Box>

      {/* Users table */}
      <TableContainer component={Card}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Account Member</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Contact Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>System Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mapped Branch</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Last Active</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={u.role} 
                    size="small" 
                    color={u.role === 'Super Admin' ? 'primary' : 'secondary'}
                    sx={{ fontWeight: 700, borderRadius: '6px' }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Store size={14} color={theme.palette.text.secondary} />
                    <Typography variant="body2">{u.outlet}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: u.lastActive === 'Active now' ? 'success.main' : 'text.secondary', fontWeight: u.lastActive === 'Active now' ? 700 : 500 }}>
                    {u.lastActive}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleViewProfile(u)}
                    >
                      <Eye size={15} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      disabled={u.email === currentUser?.email}
                      onClick={() => handleDeleteUser(u.id, u.name)}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 400 } }}>
        <form onSubmit={handleCreateUser}>
          <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Register Admin Account</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              label="Full Name"
              value={uName}
              onChange={(e) => setUName(e.target.value)}
              required
            />
            <TextField
              fullWidth
              size="small"
              type="email"
              label="Email Address"
              value={uEmail}
              onChange={(e) => setUEmail(e.target.value)}
              required
            />
            <FormControl fullWidth size="small">
              <InputLabel>Assign Role</InputLabel>
              <Select
                value={uRole}
                label="Assign Role"
                onChange={(e) => setURole(e.target.value as Role)}
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
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Outlet Scope</InputLabel>
              <Select
                value={uOutlet}
                label="Outlet Scope"
                onChange={(e) => setUOutlet(e.target.value)}
              >
                <MenuItem value="all">All Outlets (Global)</MenuItem>
                {outlets.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Create User</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View User Profile Dialog */}
      <Dialog 
        open={isProfileOpen} 
        onClose={() => { setIsProfileOpen(false); setSelectedUser(null); }} 
        PaperProps={{ sx: { borderRadius: 4, width: 440 } }}
      >
        {selectedUser && (
          <>
            <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShieldCheck size={20} style={{ color: theme.palette.primary.main }} />
              Admin Member Profile
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(27,67,50,0.04)', p: 2.5, borderRadius: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52, fontSize: '1.2rem', fontWeight: 800 }}>
                  {selectedUser.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>{selectedUser.name}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{selectedUser.email}</Typography>
                  <Chip label={selectedUser.role} size="small" color="primary" sx={{ mt: 0.5, fontWeight: 700, borderRadius: 1 }} />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>ACCOUNT MEMBER ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedUser.id}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>MAPPED OPERATIONAL SCOPE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedUser.outlet}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>LAST SESSION ACTIVE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: selectedUser.lastActive === 'Active now' ? 'success.main' : 'text.primary' }}>
                    {selectedUser.lastActive}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>ACCESS PROFILE SIGNATURE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem' }}>
                    IP: 192.168.1.{Math.floor(10 + Math.random() * 80)} | Browser: Admin Web Session
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => { setIsProfileOpen(false); setSelectedUser(null); }}>Close Profile</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default UserManagement;
