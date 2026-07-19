import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Avatar, Rating, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, useTheme, Tooltip, CircularProgress, Pagination 
} from '@mui/material';
import { 
  Bike, ShieldCheck, ShieldAlert, Plus, Compass, 
  Calendar, Phone, MapPin, UserPlus2, UserCheck
} from 'lucide-react';
import { addNotification } from '../store';
import { deliveryPartnerService, DeliveryPartner, DeliveryPartnerStats } from '../services/deliveryPartnerService';

const DeliveryPartners: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [riders, setRiders] = useState<DeliveryPartner[]>([]);
  const [stats, setStats] = useState<DeliveryPartnerStats>({
    total_riders: 0,
    available_riders: 0,
    busy_riders: 0,
    offline_riders: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const size = 10;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [addOpen, setAddOpen] = useState(false);
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderVehicle, setNewRiderVehicle] = useState<'Bike' | 'Scooter' | 'E-Bike'>('Bike');
  const [newRiderPlate, setNewRiderPlate] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, statsRes] = await Promise.all([
        deliveryPartnerService.getPartners(page, size, debouncedSearch, statusFilter),
        deliveryPartnerService.getSummaryStats()
      ]);
      setRiders(res.data);
      setTotal(res.total);
      setStats(statsRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerifyLicense = async (riderId: string, currentStatus: boolean, name: string) => {
    try {
      await deliveryPartnerService.verifyLicense(riderId, !currentStatus);
      dispatch(addNotification({
        title: 'Rider Compliance Update',
        description: `${name}'s license verification set to ${!currentStatus}`,
        type: 'system'
      }));
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleDuty = async (riderId: string, currentStatus: string, name: string) => {
    try {
      const nextStatus = currentStatus === 'Offline' ? 'Available' : 'Offline';
      await deliveryPartnerService.updateDutyStatus(riderId, nextStatus);
      dispatch(addNotification({
        title: 'Rider Duty Shift',
        description: `${name} is now ${nextStatus}`,
        type: 'system'
      }));
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddRiderSubmit = async () => {
    if (!newRiderName || !newRiderPhone || !newRiderPlate) return;

    try {
      await deliveryPartnerService.createPartner({
        full_name: newRiderName,
        mobile_number: newRiderPhone,
        vehicle_type: newRiderVehicle,
        vehicle_number: newRiderPlate
      });

      dispatch(addNotification({
        title: 'New Rider Registered',
        description: `${newRiderName} added to the dispatch fleet.`,
        type: 'system'
      }));

      setAddOpen(false);
      setNewRiderName('');
      setNewRiderPhone('');
      setNewRiderPlate('');
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const activeDispatches = riders.filter(r => r.status === 'On Delivery');

  return (
    <Box>
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

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>Total Fleet Size</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>{stats.total_riders} Riders</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Across all vehicle formats</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>On-Duty Riders</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>
                {stats.available_riders + stats.busy_riders} Active
              </Typography>
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                {stats.busy_riders} carrying deliveries
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
                      onChange={(e) => setStatusFilter(e.target.value)}
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
                {loading ? (
                   <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Rider Account</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Compliance</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Earnings</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Duty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {riders.map((rider) => (
                        <TableRow key={rider.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar src={`https://api.dicebear.com/7.x/initials/svg?seed=${rider.full_name}`} sx={{ width: 36, height: 36 }} />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{rider.full_name}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Phone size={11} /> {rider.mobile_number}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Tooltip title={rider.license_verified ? "License Verified" : "License Missing"}>
                                <IconButton 
                                  size="small" 
                                  color={rider.license_verified ? 'success' : 'error'}
                                  onClick={() => handleVerifyLicense(rider.id, rider.license_verified, rider.full_name)}
                                >
                                  {rider.license_verified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ${rider.total_earnings.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={rider.status}
                              size="small"
                              sx={{ 
                                fontWeight: 700, 
                                borderRadius: '6px',
                                bgcolor: rider.status === 'Available' ? 'success.light' : 
                                         rider.status === 'On Delivery' ? 'warning.light' : 'action.disabledBackground',
                                color: rider.status === 'Available' ? 'success.dark' : 
                                       rider.status === 'On Delivery' ? 'warning.dark' : 'text.secondary'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button 
                              variant={rider.status !== 'Offline' ? "outlined" : "contained"}
                              size="small"
                              color={rider.status !== 'Offline' ? "error" : "primary"}
                              onClick={() => handleToggleDuty(rider.id, rider.status, rider.full_name)}
                              sx={{ textTransform: 'none', borderRadius: 2, minWidth: 90 }}
                            >
                              {rider.status !== 'Offline' ? 'Go Offline' : 'Go Online'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Pagination count={Math.ceil(total / size) || 1} page={page} onChange={(_, p) => setPage(p)} color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%', minHeight: 400 }}>
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 2 }}>
                Live Tracking Monitor
              </Typography>
              <Box sx={{ 
                flexGrow: 1, 
                bgcolor: theme.palette.mode === 'dark' ? '#1a2027' : '#f5f5f5', 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                position: 'relative',
                overflow: 'hidden',
                minHeight: 250
              }}>
                <MapPin size={48} color={theme.palette.text.disabled} opacity={0.5} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Live map interface will render here
                </Typography>

                {activeDispatches.map((r, i) => (
                  <Tooltip key={r.id} title={`${r.full_name} - On Delivery`}>
                    <Avatar 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${r.full_name}`}
                      sx={{ 
                        width: 28, height: 28, 
                        position: 'absolute', 
                        top: `${30 + (i * 15)}%`, 
                        left: `${40 + (i * 20)}%`,
                        border: `2px solid ${theme.palette.warning.main}`,
                        boxShadow: 3
                      }} 
                    />
                  </Tooltip>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Register New Delivery Partner</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <TextField
            label="Full Name"
            fullWidth size="small"
            value={newRiderName}
            onChange={(e) => setNewRiderName(e.target.value)}
          />
          <TextField
            label="Phone Number"
            fullWidth size="small"
            value={newRiderPhone}
            onChange={(e) => setNewRiderPhone(e.target.value)}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Vehicle Type</InputLabel>
            <Select value={newRiderVehicle} label="Vehicle Type" onChange={(e) => setNewRiderVehicle(e.target.value as any)}>
              <MenuItem value="Bike">Motorcycle / Bike</MenuItem>
              <MenuItem value="Scooter">Scooter</MenuItem>
              <MenuItem value="E-Bike">Electric Bike (EV)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="License Plate / Registration"
            fullWidth size="small"
            value={newRiderPlate}
            onChange={(e) => setNewRiderPlate(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleAddRiderSubmit} variant="contained" sx={{ textTransform: 'none', borderRadius: 2 }}>
            Register Rider
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveryPartners;
