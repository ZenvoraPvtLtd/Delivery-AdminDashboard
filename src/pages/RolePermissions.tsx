import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Select, MenuItem, FormControl, 
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Checkbox, Button, Alert, useTheme, Grid, Divider
} from '@mui/material';
import { ShieldCheck, RefreshCw, KeyRound, Check, HelpCircle } from 'lucide-react';
import { RootState, togglePermission, resetPermissions, addAuditLog } from '../store';
import { Role } from '../store';

const modules = [
  'Dashboard', 'Orders', 'Products', 'Inventory', 'Customers', 
  'Delivery Partners', 'Outlet Management', 'Coupons', 'Payments', 
  'Reviews', 'Reports', 'Banner Management', 'User Management', 
  'Role & Permissions', 'Audit Logs', 'Settings'
];

const RolePermissions: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  const rbac = useSelector((state: RootState) => state.rbac);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [selectedRole, setSelectedRole] = useState<Role>('Super Admin');
  const [saveAlert, setSaveAlert] = useState(false);

  const handleCheckboxChange = (module: string, action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'approve') => {
    dispatch(togglePermission({
      role: selectedRole,
      module,
      action
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Modified permission: ${selectedRole} -> ${module} -> ${action}`,
      module: 'Role & Permissions',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  const handleReset = () => {
    dispatch(resetPermissions());
    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Reset all roles permissions`,
      module: 'Role & Permissions',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  const handleSave = () => {
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 3000);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Role Based Access Control
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Configure granular permissions for administrative accounts and operations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleReset} 
            startIcon={<RefreshCw size={16} />}
            sx={{ 
              borderRadius: 2,
              fontWeight: 600,
              fontFamily: 'Outfit',
              borderWidth: '1.5px',
              '&:hover': {
                borderWidth: '1.5px',
                bgcolor: 'rgba(27, 67, 50, 0.05)'
              }
            }}
          >
            Reset Defaults
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave} 
            startIcon={<Check size={16} />}
            sx={{ borderRadius: 2 }}
          >
            Apply Policy Changes
          </Button>
        </Box>
      </Box>

      {saveAlert && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          Security policy maps saved. Changes are propagated to all active sessions instantly.
        </Alert>
      )}

      <Grid container spacing={3.5}>
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <KeyRound size={22} color={theme.palette.primary.main} />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Select System Role</Typography>
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Select a target role below to view and update access rules for its assigned users.
              </Typography>

              <FormControl fullWidth size="medium">
                <InputLabel>System Role</InputLabel>
                <Select
                  value={selectedRole}
                  label="System Role"
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  sx={{ borderRadius: 2.5 }}
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

              <Divider sx={{ my: 1 }} />

              <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
                  Live RBAC Tester Hint
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.4 }}>
                  If you check/uncheck permissions for <strong>{currentUser?.role}</strong> (your current role), you will see matching tabs disappear from the sidebar or get blocked instantly. Try disabling <strong>Dashboard</strong> or <strong>Orders</strong> read access to test!
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                  Permission Matrix: <span style={{ color: theme.palette.primary.main }}>{selectedRole}</span>
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Module Name</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Read</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Create</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Update</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Delete</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Export</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Approve</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modules.map((module) => {
                      const permissions = rbac[selectedRole]?.[module] || { create: false, read: false, update: false, delete: false, export: false, approve: false };
                      return (
                        <TableRow key={module} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 600, py: 1.2 }}>{module}</TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              checked={permissions.read} 
                              onChange={() => handleCheckboxChange(module, 'read')}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              checked={permissions.create} 
                              onChange={() => handleCheckboxChange(module, 'create')}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              checked={permissions.update} 
                              onChange={() => handleCheckboxChange(module, 'update')}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              checked={permissions.delete} 
                              onChange={() => handleCheckboxChange(module, 'delete')}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              checked={permissions.export} 
                              onChange={() => handleCheckboxChange(module, 'export')}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              checked={permissions.approve} 
                              onChange={() => handleCheckboxChange(module, 'approve')}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RolePermissions;
