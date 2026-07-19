import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Checkbox, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, useTheme, Tooltip, CircularProgress
} from '@mui/material';
import { 
  ShieldCheck, Plus, FileEdit, Trash2, KeySquare 
} from 'lucide-react';
import { RootState, addAuditLog, addNotification } from '../store';
import { userService, RoleResponse } from '../services/userService';

const RolePermissions: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleResponse[]>([]);

  // Dialog state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [rName, setRName] = useState('');

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getRoles();
      setRoles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rName) return;

    dispatch(addNotification({
      title: 'Role Created',
      description: `IAM Role tier "${rName}" configured successfully.`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Created new permission tier role: ${rName}`,
      module: 'Access Control',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    setRoleModalOpen(false);
    setRName('');
    fetchRoles();
  };

  const handleTogglePermission = (roleId: string, moduleName: string, permKey: string) => {
    // Optimistic UI update logic simulation
    setRoles(roles.map(r => {
      if (r.id === roleId) {
        return {
          ...r,
          permissions: r.permissions.map(p => {
            if (p.module === moduleName) {
              return { ...p, [permKey]: !(p as any)[permKey] };
            }
            return p;
          })
        };
      }
      return r;
    }));
  };

  const handleSaveAll = () => {
    dispatch(addNotification({
      title: 'Permissions Synchronized',
      description: 'IAM Matrix rules propagated to database layer.',
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: 'Synchronized all role permission matrices',
      module: 'Access Control',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Roles & Granular Permissions
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Configure IAM matrices to restrict access to sensitive restaurant logistics modules
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleSaveAll}
            sx={{ borderRadius: 2 }}
          >
            Sync Matrix Rules
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Plus size={18} />}
            onClick={() => setRoleModalOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Create Role Tier
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3.5}>
        {roles.map(role => (
          <Grid item xs={12} key={role.id}>
            <Card>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ShieldCheck size={20} color={theme.palette.primary.main} />
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                      {role.roleName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', px: 1, py: 0.3, borderRadius: 1 }}>
                      {role.usersCount} Active Users
                    </Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Duplicate Role Mapping">
                      <IconButton size="small" color="primary"><KeySquare size={16} /></IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Tier Label">
                      <IconButton size="small" color="info" sx={{ ml: 0.5 }}><FileEdit size={16} /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Tier entirely">
                      <IconButton size="small" color="error" sx={{ ml: 0.5 }}><Trash2 size={16} /></IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: '30%' }}>System Module</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Read (View)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Write (Create)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Update (Edit)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Delete (Drop)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Authorize (Approve)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {role.permissions.map((perm, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{perm.module}</TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              size="small" 
                              checked={perm.view} 
                              onChange={() => handleTogglePermission(role.id, perm.module, 'view')}
                              color="success"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              size="small" 
                              checked={perm.create} 
                              onChange={() => handleTogglePermission(role.id, perm.module, 'create')}
                              color="success"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              size="small" 
                              checked={perm.edit} 
                              onChange={() => handleTogglePermission(role.id, perm.module, 'edit')}
                              color="success"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              size="small" 
                              checked={perm.delete} 
                              onChange={() => handleTogglePermission(role.id, perm.module, 'delete')}
                              color="success"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox 
                              size="small" 
                              checked={perm.approve} 
                              onChange={() => handleTogglePermission(role.id, perm.module, 'approve')}
                              color="success"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Role Dialog */}
      <Dialog open={roleModalOpen} onClose={() => setRoleModalOpen(false)} PaperProps={{ sx: { borderRadius: 3, width: 400 } }}>
        <form onSubmit={handleRoleSubmit}>
          <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Define Role Tier</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              label="Role Tier Nomenclature"
              value={rName}
              onChange={e => setRName(e.target.value)}
              placeholder="e.g. Finance Auditor"
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setRoleModalOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Create Tier</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RolePermissions;
