import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, FormControl, InputLabel, Select, MenuItem, 
  Switch, FormControlLabel, useTheme, Tabs, Tab, Divider
} from '@mui/material';
import { Percent, Plus, Clock, Gift, Users, Calendar, Check } from 'lucide-react';
import { RootState, addEditCoupon, toggleCouponStatus, addAuditLog, addNotification } from '../store';
import { Coupon } from '../store';

const CouponsOffers: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const coupons = useSelector((state: RootState) => state.db.coupons);

  const [activeTab, setActiveTab] = useState(0); // 0: Coupon Codes, 1: Promotional Offers (Happy Hours, BOGO)
  const [createOpen, setCreateOpen] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'Percentage' | 'Flat'>('Percentage');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [expiry, setExpiry] = useState('');
  const [targetType, setTargetType] = useState<'All' | 'Outlet-wise' | 'Customer-wise'>('All');

  // Local simulated offers
  const [offers, setOffers] = useState([
    { id: 'off-1', name: 'Happy Hour Beverage BOGO', details: 'Buy 1 Get 1 Free on all beverages', schedule: 'Daily 4:00 PM - 7:00 PM', status: 'Active' },
    { id: 'off-2', name: 'Weekend Family Combo Pack', details: 'Flat $8.00 off on ordering 3+ combo products', schedule: 'Friday to Sunday', status: 'Active' },
    { id: 'off-3', name: 'Monsoon Special Flash Sale', details: 'Flat 15% discount on fast foods categories', schedule: 'July 1 - July 31', status: 'Paused' }
  ]);

  const handleToggleStatus = (id: string, codeName: string) => {
    dispatch(toggleCouponStatus(id));
    const coupon = coupons.find(c => c.id === id);
    if (!coupon) return;

    dispatch(addNotification({
      title: 'Campaign Status Updated',
      description: `Coupon ${codeName} is now ${coupon.status === 'Active' ? 'Paused' : 'Active'}`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Toggled coupon status for ${codeName} to ${coupon.status === 'Active' ? 'Paused' : 'Active'}`,
      module: 'Coupons',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  const handleToggleOffer = (id: string) => {
    setOffers(offers.map(o => o.id === id ? { ...o, status: o.status === 'Active' ? 'Paused' : 'Active' } : o));
    
    dispatch(addNotification({
      title: 'Offer Campaign Toggled',
      description: `Promotional campaign set update applied.`,
      type: 'system'
    }));
  };

  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value || !minOrder || !expiry) return;

    const newCoupon: Coupon = {
      id: `cpn-${Date.now().toString().slice(-3)}`,
      code: code.toUpperCase().replace(/\s/g, ''),
      discountType,
      value: parseFloat(value),
      minOrderValue: parseFloat(minOrder),
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
      expiryDate: expiry,
      usageCount: 0,
      usageLimit: 250,
      targetType,
      status: 'Active'
    };

    dispatch(addEditCoupon(newCoupon));

    dispatch(addNotification({
      title: 'Coupon Created successfully',
      description: `New promo code ${newCoupon.code} is active.`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Created coupon code ${newCoupon.code}`,
      module: 'Coupons',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    setCreateOpen(false);
    setCode('');
    setValue('');
    setMinOrder('');
    setMaxDiscount('');
    setExpiry('');
  };

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Marketing Campaigns Desk
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Design percentage discounts coupons, BOGO Happy Hours, and scheduling banner promotions
          </Typography>
        </Box>
        {activeTab === 0 && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setCreateOpen(true)}
            startIcon={<Plus size={16} />}
            sx={{ borderRadius: 2 }}
          >
            Create Coupon code
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={(e, val) => setActiveTab(val)} 
        sx={{ mb: 3.5, borderBottom: `1px solid ${theme.palette.divider}` }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Coupon Codes Register" sx={{ fontWeight: 700 }} />
        <Tab label="Promotional Campaigns & Offers" sx={{ fontWeight: 700 }} />
      </Tabs>

      {activeTab === 0 ? (
        // TAB 1: Coupon List
        <TableContainer component={Card}>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Promo Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Discount Value</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Min Basket</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Max Cap</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Target Scope</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Expiration</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Usage Count</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {coupon.code}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Percent size={14} color={theme.palette.text.secondary} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {coupon.value}{coupon.discountType === 'Percentage' ? '%' : '$'} OFF
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>${coupon.minOrderValue.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {coupon.maxDiscount ? `$${coupon.maxDiscount.toFixed(2)}` : 'None'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={coupon.targetType} 
                      size="small" 
                      variant="outlined" 
                      color="secondary" 
                      sx={{ fontSize: '0.65rem', fontWeight: 600 }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Calendar size={13} color={theme.palette.text.secondary} />
                      <Typography variant="body2">{coupon.expiryDate}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {coupon.usageCount} / {coupon.usageLimit} claims
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={coupon.status === 'Active'}
                          disabled={coupon.status === 'Expired'}
                          onChange={() => handleToggleStatus(coupon.id, coupon.code)}
                          color="success"
                          size="small"
                        />
                      }
                      label={
                        <Chip 
                          label={coupon.status} 
                          size="small" 
                          color={
                            coupon.status === 'Active' ? 'success' : 
                            coupon.status === 'Expired' ? 'error' : 'default'
                          }
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // TAB 2: Marketing Campaigns
        <Grid container spacing={3.5}>
          {offers.map((offer) => (
            <Grid item xs={12} md={4} key={offer.id}>
              <Card>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: 'secondary.main' }}>
                      <Gift size={20} />
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={offer.status === 'Active'}
                          onChange={() => handleToggleOffer(offer.id)}
                          size="small"
                          color="success"
                        />
                      }
                      label=""
                    />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>{offer.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{offer.details}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                    <Clock size={14} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{offer.schedule}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Coupon Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 440 } }}>
        <form onSubmit={handleCreateCouponSubmit}>
          <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Create Coupon Code</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              label="Coupon Code Name (e.g. MONSOON20)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Discount Format</InputLabel>
                  <Select
                    value={discountType}
                    label="Discount Format"
                    onChange={(e) => setDiscountType(e.target.value as any)}
                  >
                    <MenuItem value="Percentage">Percentage (%)</MenuItem>
                    <MenuItem value="Flat">Flat Cash ($)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={discountType === 'Percentage' ? 'Value (%)' : 'Amount ($)'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Min Basket Value ($)"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Max Discount Cap ($)"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  disabled={discountType === 'Flat'}
                  placeholder="Optional"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Expiration Date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Target Scope</InputLabel>
                  <Select
                    value={targetType}
                    label="Target Scope"
                    onChange={(e) => setTargetType(e.target.value as any)}
                  >
                    <MenuItem value="All">All Outlets & Customers</MenuItem>
                    <MenuItem value="Outlet-wise">Specific Outlets only</MenuItem>
                    <MenuItem value="Customer-wise">Special loyal customers</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Create Campaign</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CouponsOffers;
