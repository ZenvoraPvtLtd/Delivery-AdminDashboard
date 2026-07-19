import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, FormControl, InputLabel, Select, MenuItem, 
  Switch, FormControlLabel, useTheme, Tabs, Tab, CircularProgress
} from '@mui/material';
import { Percent, Plus, Gift, Calendar } from 'lucide-react';
import { RootState, addAuditLog, addNotification } from '../store';
import { promotionService, CouponResponse, OfferResponse, CouponCreateRequest } from '../services/promotionService';

const CouponsOffers: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [activeTab, setActiveTab] = useState(0); 
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [offers, setOffers] = useState<OfferResponse[]>([]);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'Percentage' | 'Flat'>('Percentage');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [expiry, setExpiry] = useState('');
  const [targetType, setTargetType] = useState<'All' | 'Outlet-wise' | 'Customer-wise'>('All');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, oRes] = await Promise.all([
        promotionService.getCoupons(),
        promotionService.getOffers()
      ]);
      setCoupons(cRes);
      setOffers(oRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleStatus = async (id: string, codeName: string, currentStatus: string) => {
    try {
      await promotionService.toggleCouponStatus(id);
      
      dispatch(addNotification({
        title: 'Campaign Status Updated',
        description: `Coupon ${codeName} is now ${currentStatus === 'Active' ? 'Paused' : 'Active'}`,
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: `Toggled coupon status for ${codeName} to ${currentStatus === 'Active' ? 'Paused' : 'Active'}`,
        module: 'Coupons',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));
      
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleOffer = async (id: string) => {
    try {
      await promotionService.toggleOfferStatus(id);
      
      dispatch(addNotification({
        title: 'Offer Campaign Toggled',
        description: `Promotional campaign set update applied.`,
        type: 'system'
      }));
      
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value || !minOrder || !expiry) return;

    try {
      const newCoupon: CouponCreateRequest = {
        code: code.toUpperCase().replace(/\s/g, ''),
        discountType,
        value: parseFloat(value),
        minOrderValue: parseFloat(minOrder),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
        expiryDate: expiry,
        usageLimit: 250,
        targetType,
        status: 'Active'
      };

      await promotionService.createCoupon(newCoupon);

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
      
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : activeTab === 0 ? (
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
                          onChange={() => handleToggleStatus(coupon.id, coupon.code, coupon.status)}
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
              {coupons.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>No coupons found.</TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
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
                      label={
                        <Chip 
                          label={offer.status} 
                          size="small" 
                          color={offer.status === 'Active' ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                      }
                    />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 0.5 }}>{offer.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{offer.details}</Typography>
                  </Box>
                  <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px dashed ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={14} color={theme.palette.text.secondary} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{offer.schedule}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {offers.length === 0 && (
             <Typography variant="body2" sx={{ width: '100%', textAlign: 'center', py: 4, color: 'text.secondary' }}>No offers found.</Typography>
          )}
        </Grid>
      )}

      {/* Create Coupon Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Launch New Campaign</DialogTitle>
        <form onSubmit={handleCreateCouponSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Promo Code (e.g. SUMMER20)" value={code} onChange={(e) => setCode(e.target.value)} required size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Discount Type</InputLabel>
                  <Select value={discountType} label="Discount Type" onChange={(e) => setDiscountType(e.target.value as any)}>
                    <MenuItem value="Percentage">Percentage (%)</MenuItem>
                    <MenuItem value="Flat">Flat Amount ($)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={`Value ${discountType === 'Percentage' ? '(%)' : '($)'}`} type="number" value={value} onChange={(e) => setValue(e.target.value)} required size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Min Order Value ($)" type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} required size="small" />
              </Grid>
              {discountType === 'Percentage' && (
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Max Discount Cap ($)" type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} size="small" />
                </Grid>
              )}
              <Grid item xs={12} sm={discountType === 'Percentage' ? 6 : 12}>
                <TextField fullWidth label="Expiration Date (YYYY-MM-DD)" value={expiry} onChange={(e) => setExpiry(e.target.value)} required size="small" />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Targeting Scope</InputLabel>
                  <Select value={targetType} label="Targeting Scope" onChange={(e) => setTargetType(e.target.value as any)}>
                    <MenuItem value="All">All Users / Global</MenuItem>
                    <MenuItem value="Customer-wise">New Customers Only</MenuItem>
                    <MenuItem value="Outlet-wise">Specific Outlet Launch</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Activate Campaign</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CouponsOffers;
