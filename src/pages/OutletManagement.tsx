import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Switch, FormControlLabel, useTheme, Divider
} from '@mui/material';
import { 
  Store, MapPin, Phone, Clock, Landmark, Users, 
  TrendingUp, Edit2, ShieldCheck, Check 
} from 'lucide-react';
import { RootState, addAuditLog, addNotification } from '../store';

const OutletManagement: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const outlets = useSelector((state: RootState) => state.db.outlets);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<typeof outlets[0] | null>(null);

  // Form states
  const [outletName, setOutletName] = useState('');
  const [outletAddress, setOutletAddress] = useState('');
  const [outletManager, setOutletManager] = useState('');
  const [outletPhone, setOutletPhone] = useState('');
  const [outletTax, setOutletTax] = useState('');
  const [outletHours, setOutletHours] = useState('');
  const [outletStatus, setOutletStatus] = useState(true);

  const handleEditClick = (outlet: typeof outlets[0]) => {
    setSelectedOutlet(outlet);
    setOutletName(outlet.name);
    setOutletAddress(outlet.address);
    setOutletManager(outlet.manager);
    setOutletPhone(outlet.phone);
    setOutletTax(outlet.taxNumber);
    setOutletHours(outlet.hours);
    setOutletStatus(outlet.status === 'Open');
    setEditOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutlet) return;

    // Simulate saving outlet adjustments locally
    // In real app we would dispatch an action. For high fidelity, we show a success toast and log.
    dispatch(addNotification({
      title: 'Outlet Settings Saved',
      description: `${outletName} operational parameters updated.`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Modified outlet details for ${outletName}`,
      module: 'Outlet Management',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    setEditOpen(false);
    setSelectedOutlet(null);
  };

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
          Multi-Outlet Administration
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Manage restaurant outlet profiles, tax configurations, and operational business hours
        </Typography>
      </Box>

      {/* Outlets Grid */}
      <Grid container spacing={3.5} sx={{ mb: 4 }}>
        {outlets.map((outlet) => (
          <Grid item xs={12} md={6} key={outlet.id}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: 'primary.main' }}>
                      <Store size={22} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                        {outlet.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                        <MapPin size={12} color={theme.palette.text.secondary} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{outlet.address}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Chip 
                    label={outlet.status} 
                    color={outlet.status === 'Open' ? 'success' : 'default'} 
                    size="small"
                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Branch Manager</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{outlet.manager}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>Phone: {outlet.phone}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Operating Hours</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{outlet.hours}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>Taxes: {outlet.taxNumber}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Today's Revenue</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      ${outlet.revenue.toLocaleString()}
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => handleEditClick(outlet)}
                    startIcon={<Edit2 size={13} />}
                  >
                    Edit Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Outlet Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 440 } }}>
        <form onSubmit={handleSaveSubmit}>
          <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>
            Outlet Config: {selectedOutlet?.name.split(' ')[0]}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              label="Outlet Name"
              value={outletName}
              onChange={(e) => setOutletName(e.target.value)}
              required
            />
            <TextField
              fullWidth
              size="small"
              label="Branch Address"
              value={outletAddress}
              onChange={(e) => setOutletAddress(e.target.value)}
              required
            />
            <TextField
              fullWidth
              size="small"
              label="Branch Manager"
              value={outletManager}
              onChange={(e) => setOutletManager(e.target.value)}
              required
            />
            <TextField
              fullWidth
              size="small"
              label="Phone Number"
              value={outletPhone}
              onChange={(e) => setOutletPhone(e.target.value)}
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="GSTIN Tax Reference"
                  value={outletTax}
                  onChange={(e) => setOutletTax(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Service Hours"
                  value={outletHours}
                  onChange={(e) => setOutletHours(e.target.value)}
                  required
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={outletStatus}
                  onChange={(e) => setOutletStatus(e.target.checked)}
                  color="success"
                />
              }
              label={<Typography variant="body2">Open Store for Online Orders</Typography>}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save Changes</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default OutletManagement;
