import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Avatar, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, FormControl, InputLabel, Select,
  useTheme, Tooltip, CircularProgress
} from '@mui/material';
import { 
  Users as UsersIcon, Plus, UserPlus, Shield, UserX, UserCheck, Search, FileEdit, Trash2 
} from 'lucide-react';
import { RootState, addAuditLog, addNotification } from '../store';
import { userService, UserResponse } from '../services/userService';

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserResponse[]>([]);

  // Dialog states
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create'|'edit'>('create');
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uRole, setURole] = useState('Admin');

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setUName('');
    setUEmail('');
    setURole('Admin');
    setUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uName || !uEmail) return;

    // Simulate creation/update via API then refetch
    // In actual implementation, we'd POST/PUT to backend
    dispatch(addNotification({
      title: modalMode === 'create' ? 'User Created' : 'User Updated',
      description: `${uName} has been ${modalMode === 'create' ? 'added to' : 'updated in'} the system directory.`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `${modalMode === 'create' ? 'Created' : 'Updated'} user profile: ${uName}`,
      module: 'User Management',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    setUserModalOpen(false);
    
    // Simulate updating local state for immediate feedback
    if (modalMode === 'create') {
      const newUser: UserResponse = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: uName,
        email: uEmail,
        role: uRole,
        department: 'Operations',
        status: 'Active',
        lastActive: new Date().toISOString().split('T')[0]
      };
      setUsers([...users, newUser]);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            User Management Directory
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Provision access, suspend employees, and enforce IAM security protocols
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<UserPlus size={18} />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: 2 }}
        >
          Provision New User
        </Button>
      </Box>

      {/* Top stats */}
      <Grid container spacing={3.5} sx={{ mb: 4 }}>
        {[
          { title: 'Total Registered Accounts', val: users.length, color: '#0D9488', icon: <UsersIcon size={22} /> },
          { title: 'Active System Administrators', val: users.filter(u=>u.role==='Admin').length, color: '#F59E0B', icon: <Shield size={22} /> },
          { title: 'Suspended Accounts', val: users.filter(u=>u.status!=='Active').length, color: '#E11D48', icon: <UserX size={22} /> }
        ].map((stat, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.5, width: '100%' }}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: stat.color }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{stat.title}</Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>{stat.val}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ position: 'relative', width: 280 }}>
              <Search size={16} style={{ position: 'absolute', top: 12, left: 12, color: theme.palette.text.secondary }} />
              <TextField 
                size="small" 
                fullWidth 
                placeholder="Search by name, email or role..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { pl: 4, borderRadius: 2 } }}
              />
            </Box>
          </Box>
          <TableContainer>
            {loading ? (
               <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
            ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Employee Details</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role / Permission Tier</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>IAM Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Last Login Auth</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: '0.9rem', bgcolor: theme.palette.primary.main }}>
                          {user.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user.name}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        size="small" 
                        variant="outlined"
                        color={user.role === 'Admin' ? 'secondary' : user.role === 'Manager' ? 'info' : 'default'}
                        sx={{ fontWeight: 600, height: 22, fontSize: '0.7rem' }} 
                      />
                    </TableCell>
                    <TableCell><Typography variant="body2">{user.department}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {user.status === 'Active' ? <UserCheck size={14} color="#10B981" /> : <UserX size={14} color="#E11D48" />}
                        <Typography variant="caption" sx={{ fontWeight: 700, color: user.status === 'Active' ? '#10B981' : '#E11D48' }}>
                          {user.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: 'text.secondary' }}>{user.lastActive}</Typography></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit IAM Profile">
                        <IconButton size="small" color="primary"><FileEdit size={16} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Revoke Access (Terminate)">
                        <IconButton size="small" color="error" sx={{ ml: 0.5 }}><Trash2 size={16} /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No user accounts found matching that query.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </TableContainer>
        </CardContent>
      </Card>

      {/* User Create/Edit Dialog */}
      <Dialog open={userModalOpen} onClose={() => setUserModalOpen(false)} PaperProps={{ sx: { borderRadius: 3, width: 450 } }}>
        <form onSubmit={handleUserSubmit}>
          <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
            {modalMode === 'create' ? 'Provision New User' : 'Edit IAM Profile'}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              label="Full Name"
              value={uName}
              onChange={e => setUName(e.target.value)}
              required
            />
            <TextField
              size="small"
              fullWidth
              type="email"
              label="Corporate Email Address"
              value={uEmail}
              onChange={e => setUEmail(e.target.value)}
              required
            />
            <FormControl fullWidth size="small">
              <InputLabel>Permission Role Tier</InputLabel>
              <Select
                value={uRole}
                label="Permission Role Tier"
                onChange={e => setURole(e.target.value)}
              >
                <MenuItem value="Admin">System Administrator</MenuItem>
                <MenuItem value="Manager">Operations Manager</MenuItem>
                <MenuItem value="Staff">Support Staff</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setUserModalOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {modalMode === 'create' ? 'Provision Account' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
