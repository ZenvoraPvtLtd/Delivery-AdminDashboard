import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Avatar, Rating, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, useTheme, Tooltip 
} from '@mui/material';
import { 
  Bike, ShieldCheck, ShieldAlert, Plus, Compass, 
  Calendar, Phone, MapPin, UserPlus2, UserCheck
} from 'lucide-react';
import { RootState, DeliveryPartner, addEditRider, addAuditLog, addNotification } from '../store';

const DeliveryPartners: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const riders = useSelector((state: RootState) => state.db.deliveryPartners);
  const orders = useSelector((state: RootState) => state.db.orders);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | typeof riders[0]['status']>('All');
  
  const [addOpen, setAddOpen] = useState(false);
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderVehicle, setNewRiderVehicle] = useState<'Bike' | 'Scooter' | 'E-Bike'>('Bike');
  const [newRiderPlate, setNewRiderPlate] = useState('');

  const filteredRiders = riders.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search);
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleVerifyLicense = (riderId: string) => {
    const rider = riders.find(r => r.id === riderId);
    if (!rider) return;

    const updatedRider = {
      ...rider,
      licenseVerified: !rider.licenseVerified
    };

    dispatch(addEditRider(updatedRider));

    dispatch(addNotification({
      title: 'Rider Compliance Update',
      description: `${rider.name}'s license verification set to ${!rider.licenseVerified}`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Toggled license verification for rider ${rider.name}`,
      module: 'Delivery Partners',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  const handleToggleDuty = (riderId: string) => {
    const rider = riders.find(r => r.id === riderId);
    if (!rider) return;

    const nextStatus: DeliveryPartner['status'] = rider.status === 'Offline' ? 'Available' : 'Offline';

    const updatedRider = {
      ...rider,
      status: nextStatus
    };

    dispatch(addEditRider(updatedRider));

    dispatch(addNotification({
      title: 'Rider Duty Shift',
      description: `${rider.name} is now ${nextStatus}`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Toggled duty shift for rider ${rider.name} to ${nextStatus}`,
      module: 'Delivery Partners',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  const handleAddRiderSubmit = () => {
    if (!newRiderName || !newRiderPhone || !newRiderPlate) return;

    const newRider = {
      id: `rider-${Date.now().toString().slice(-3)}`,
      name: newRiderName,
      phone: newRiderPhone,
      vehicleType: newRiderVehicle,
      vehicleNumber: newRiderPlate,
      licenseVerified: true,
      insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Available' as const,
      rating: 5.0,
      earnings: 0.0,
      latitude: 40.7128,
      longitude: -74.0060,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?w=100`
    };

    dispatch(addEditRider(newRider));

    dispatch(addNotification({
      title: 'New Rider Registered',
      description: `${newRiderName} added to the dispatch fleet.`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Registered new delivery partner ${newRiderName}`,
      module: 'Delivery Partners',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    // Reset Form
    setAddOpen(false);
    setNewRiderName('');
    setNewRiderPhone('');
    setNewRiderPlate('');
  };

  // Find dispatch locations for map visualization
  const activeDispatches = riders.filter(r => r.status === 'On Delivery');

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Delivery Fleet Station
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Verify delivery partner credentials, manage schedules, and view live active dispatches
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setAddOpen(true)}
          startIcon={<UserPlus2 size={16} />}
          sx={{ borderRadius: 2 }}
        >
          Add New Rider
        </Button>
      </Box>

      {/* Analytics stats row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>Total Fleet Size</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>{riders.length} Riders</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Across 3 vehicle formats</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>On-Duty Riders</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>
                {riders.filter(r => r.status !== 'Offline').length} Active
              </Typography>
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                {activeDispatches.length} carrying deliveries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>Fleet Average Rating</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>4.65</Typography>
                <Rating value={4.65} precision={0.1} readOnly size="small" />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Based on customer reviews</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3.5}>
        {/* Fleet roster table */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                  Rider Roster Details
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexGrow: 1, justifyContent: 'flex-end' }}>
                  <TextField
                    size="small"
                    label="Search name, phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ width: 220 }}
                  />
                  <FormControl size="small" sx={{ width: 140 }}>
                    <InputLabel>Duty Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Duty Status"
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                      <MenuItem value="All">All statuses</MenuItem>
                      <MenuItem value="Available">Available</MenuItem>
                      <MenuItem value="On Delivery">On Delivery</MenuItem>
                      <MenuItem value="Offline">Offline</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Rider Account</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Vehicle Details</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Compliance</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Earnings</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Duty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRiders.map((rider) => (
                      <TableRow key={rider.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar src={rider.avatar} sx={{ width: 34, height: 34 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{rider.name}</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Phone size={11} color={theme.palette.text.secondary} />
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{rider.phone}</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{rider.vehicleType}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{rider.vehicleNumber}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {rider.licenseVerified ? (
                              <Chip 
                                size="small"
                                label="License Ok" 
                                color="success" 
                                variant="outlined"
                                icon={<ShieldCheck size={12} />}
                                onClick={() => handleVerifyLicense(rider.id)}
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer' }}
                              />
                            ) : (
                              <Chip 
                                size="small"
                                label="Verification Pending" 
                                color="error" 
                                variant="outlined"
                                icon={<ShieldAlert size={12} />}
                                onClick={() => handleVerifyLicense(rider.id)}
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ${rider.earnings.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={rider.status} 
                            size="small" 
                            sx={{ 
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              borderRadius: '6px',
                              bgcolor: 
                                rider.status === 'Available' ? 'rgba(16, 185, 129, 0.1)' :
                                rider.status === 'On Delivery' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                              color:
                                rider.status === 'Available' ? 'success.main' :
                                rider.status === 'On Delivery' ? 'secondary.main' : 'text.secondary',
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={rider.status === 'Offline' ? "Clock In Shift" : "Clock Out Shift"}>
                            <IconButton 
                              size="small"
                              onClick={() => handleToggleDuty(rider.id)}
                              disabled={rider.status === 'On Delivery'}
                              color="secondary"
                            >
                              <UserCheck size={16} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Live GPS locator panel */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Compass size={18} color={theme.palette.primary.main} />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Active Dispatch Map
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Operational view of riders executing food dispatches.
              </Typography>

              {/* Graphical simulation of map */}
              <Box 
                className={theme.palette.mode === 'dark' ? 'map-grid-bg' : 'map-grid-bg-light'}
                sx={{ 
                  height: 240, 
                  borderRadius: 3.5, 
                  border: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Center Store Pin */}
                <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
                  <MapPin size={22} color="#047857" fill="#047857" />
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, bgcolor: 'background.paper', px: 0.5, py: 0.1, borderRadius: 0.5, border: `1px solid ${theme.palette.divider}` }}>Branch Hub</Typography>
                </Box>

                {/* Draw active dispatches */}
                {activeDispatches.length === 0 ? (
                  <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyItems: 'center', p: 3, zIndex: 4 }}>
                    <Typography variant="body2" sx={{ color: 'white', textAlign: 'center', width: '100%', fontWeight: 600 }}>
                      No active dispatches right now. Assign Available riders in the Orders desk.
                    </Typography>
                  </Box>
                ) : (
                  activeDispatches.map((r, idx) => {
                    // Compute coordinate screen values relative to hub (50%, 50%)
                    const screenX = 50 + (r.longitude - (-74.0060)) * 1200;
                    const screenY = 50 - (r.latitude - 40.7128) * 1200;
                    return (
                      <Box 
                        key={r.id} 
                        sx={{ 
                          position: 'absolute', 
                          left: `${Math.max(10, Math.min(90, screenX))}%`, 
                          top: `${Math.max(10, Math.min(90, screenY))}%`, 
                          transform: 'translate(-50%, -50%)', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          zIndex: 2
                        }}
                      >
                        <Box sx={{ p: 0.6, bgcolor: 'success.main', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex' }}>
                          <Bike size={13} color="white" />
                        </Box>
                        <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 700, bgcolor: 'background.paper', px: 0.4, borderRadius: 0.5 }}>
                          {r.name.split(' ')[0]}
                        </Typography>
                      </Box>
                    );
                  })
                )}
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center' }}>
                Rider markers move dynamically along localized GPS grids.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Rider Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} PaperProps={{ sx: { borderRadius: 3, width: 400 } }}>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Add Delivery Partner</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Rider Name"
            value={newRiderName}
            onChange={(e) => setNewRiderName(e.target.value)}
            placeholder="e.g. Samuel Jackson"
          />
          <TextField
            fullWidth
            size="small"
            label="Phone Number"
            value={newRiderPhone}
            onChange={(e) => setNewRiderPhone(e.target.value)}
            placeholder="+1 555-xxxx"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Vehicle Type</InputLabel>
            <Select
              value={newRiderVehicle}
              label="Vehicle Type"
              onChange={(e) => setNewRiderVehicle(e.target.value as any)}
            >
              <MenuItem value="Bike">Motorcycle</MenuItem>
              <MenuItem value="Scooter">Scooter</MenuItem>
              <MenuItem value="E-Bike">Electric Bike</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="License Plate Number"
            value={newRiderPlate}
            onChange={(e) => setNewRiderPlate(e.target.value)}
            placeholder="e.g. MC-9812"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAddRiderSubmit} variant="contained" color="primary" disabled={!newRiderName || !newRiderPhone || !newRiderPlate}>
            Register Rider
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveryPartners;
