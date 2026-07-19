import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Button, 
  Drawer, Divider, TextField, Alert, useTheme, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Pagination
} from '@mui/material';
import { 
  Search, Eye, ShieldAlert, ShieldCheck, Wallet, 
  Award, Heart, ShoppingBag, Plus, Minus, X, UserPlus
} from 'lucide-react';
import { addNotification } from '../store';
import { customerService, Customer, Address, WalletTransaction } from '../services/customerService';

const Customers: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const size = 10;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDesc, setWalletDesc] = useState('');
  const [showWalletAdjust, setShowWalletAdjust] = useState(false);
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New Customer Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCust, setNewCust] = useState({ full_name: '', email: '', mobile_number: '' });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers(page, size, debouncedSearch);
      setCustomers(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const loadCustomerDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      setSelectedCustId(id);
      
      const [cust, addr, hist] = await Promise.all([
        customerService.getCustomer(id),
        customerService.getAddresses(id),
        customerService.getWalletHistory(id)
      ]);
      
      setSelectedCustomer(cust);
      setAddresses(addr);
      setWalletHistory(hist);
    } catch (error) {
      console.error(error);
      setSelectedCustId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleBlock = async (customer: Customer) => {
    try {
      if (customer.status === 'Blocked') {
        await customerService.unblockCustomer(customer.id);
        dispatch(addNotification({ title: 'Success', description: `${customer.full_name} unblocked`, type: 'system' }));
      } else {
        await customerService.blockCustomer(customer.id);
        dispatch(addNotification({ title: 'Warning', description: `${customer.full_name} blocked`, type: 'system' }));
      }
      fetchCustomers();
      if (selectedCustomer?.id === customer.id) {
        loadCustomerDetails(customer.id);
      }
    } catch (error) {
      console.error("Failed to block/unblock", error);
    }
  };

  const handleWalletAdjustSubmit = async (isCredit: boolean) => {
    if (!selectedCustomer || !walletAmount || !walletDesc) return;
    const value = parseFloat(walletAmount);
    if (isNaN(value) || value <= 0) return;

    const amount = isCredit ? value : -value;

    try {
      await customerService.adjustWallet(selectedCustomer.id, amount, walletDesc);
      dispatch(addNotification({
        title: 'Wallet Adjusted',
        description: `Successfully adjusted by $${amount.toFixed(2)}`,
        type: 'system'
      }));
      setWalletAmount('');
      setWalletDesc('');
      setShowWalletAdjust(false);
      
      // Refresh details
      loadCustomerDetails(selectedCustomer.id);
      fetchCustomers();
    } catch (error) {
      console.error("Wallet adjust failed", error);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCust.full_name || !newCust.email || !newCust.mobile_number) return;
    try {
      await customerService.createCustomer(newCust);
      dispatch(addNotification({ title: 'Created', description: 'Customer created successfully', type: 'system' }));
      setCreateModalOpen(false);
      setNewCust({ full_name: '', email: '', mobile_number: '' });
      fetchCustomers();
    } catch (error) {
      console.error("Creation failed", error);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>Customer Registry</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Monitor customer profiles, wallets, and addresses
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<UserPlus size={18} />} onClick={() => setCreateModalOpen(true)}>
          Add Customer
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Search customer name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search size={16} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Total {total} customers found
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Card}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contact Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phone Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Wallet Balance</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Reward Points</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{c.full_name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.mobile_number}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>${c.wallet_balance.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'secondary.main' }}>{c.reward_points} pts</TableCell>
                  <TableCell>
                    <Chip 
                      label={c.status} 
                      size="small" 
                      color={c.status === 'Blocked' ? 'error' : 'success'}
                      sx={{ fontWeight: 700, borderRadius: '6px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <IconButton size="small" color="primary" onClick={() => loadCustomerDetails(c.id)}>
                        <Eye size={17} />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color={c.status === 'Blocked' ? 'success' : 'error'}
                        onClick={() => handleToggleBlock(c)}
                      >
                        {c.status === 'Blocked' ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />}
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination 
          count={Math.ceil(total / size) || 1} 
          page={page} 
          onChange={(_, p) => setPage(p)} 
          color="primary" 
        />
      </Box>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedCustId)}
        onClose={() => { setSelectedCustId(null); setShowWalletAdjust(false); }}
        sx={{ zIndex: 1300 }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
      >
        {loadingDetails ? (
           <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : selectedCustomer && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', overflowY: 'auto', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>Customer Profile</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                  <strong>{selectedCustomer.full_name}</strong> - {selectedCustomer.email}
                </Typography>
              </Box>
              <IconButton onClick={() => { setSelectedCustId(null); setShowWalletAdjust(false); }} size="small">
                <X size={20} />
              </IconButton>
            </Box>

            <Divider />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
                      <Wallet size={16} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Wallet Balance</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>${selectedCustomer.wallet_balance.toFixed(2)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'secondary.main' }}>
                      <Award size={16} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Reward Points</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedCustomer.reward_points} pts</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box>
              <Button variant="outlined" size="small" onClick={() => setShowWalletAdjust(!showWalletAdjust)} startIcon={<Wallet size={14} />}>
                Adjust Wallet Ledger
              </Button>
            </Box>

            {showWalletAdjust && (
              <Card sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Wallet Credit/Debit Panel</Typography>
                  <TextField size="small" type="number" label="Amount ($)" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} />
                  <TextField size="small" label="Description" value={walletDesc} onChange={(e) => setWalletDesc(e.target.value)} />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button size="small" onClick={() => setShowWalletAdjust(false)}>Cancel</Button>
                    <Button size="small" variant="contained" color="error" startIcon={<Minus size={13} />} onClick={() => handleWalletAdjustSubmit(false)}>Debit</Button>
                    <Button size="small" variant="contained" color="success" startIcon={<Plus size={13} />} onClick={() => handleWalletAdjustSubmit(true)}>Credit</Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Delivery Addresses</Typography>
              {addresses.length === 0 ? <Typography variant="body2">No addresses</Typography> : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {addresses.map((addr) => (
                    <Card key={addr.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{addr.address_type}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {addr.address_line}, {addr.city}, {addr.state} {addr.postal_code}
                      </Typography>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Wallet History</Typography>
              {walletHistory.length === 0 ? <Typography variant="body2">No transactions</Typography> : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {walletHistory.map((w) => (
                    <Box key={w.id} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #eee' }}>
                      <Box>
                        <Typography variant="body2">{w.reason}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{new Date(w.created_at).toLocaleDateString()}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: w.transaction_type === 'Credit' ? 'success.main' : 'error.main' }}>
                        {w.transaction_type === 'Credit' ? '+' : '-'}${w.amount.toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

          </Box>
        )}
      </Drawer>

      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)}>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Full Name" size="small" value={newCust.full_name} onChange={(e) => setNewCust({...newCust, full_name: e.target.value})} />
          <TextField label="Email" size="small" value={newCust.email} onChange={(e) => setNewCust({...newCust, email: e.target.value})} />
          <TextField label="Mobile Number" size="small" value={newCust.mobile_number} onChange={(e) => setNewCust({...newCust, mobile_number: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateCustomer}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
