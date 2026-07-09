import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Button, 
  Drawer, Divider, TextField, Alert, useTheme, Grid 
} from '@mui/material';
import { 
  Search, Eye, ShieldAlert, ShieldCheck, Wallet, 
  Award, Heart, ShoppingBag, Plus, Minus 
} from 'lucide-react';
import { 
  RootState, updateCustomerStatus, adjustCustomerWallet, 
  addAuditLog, addNotification 
} from '../store';

const Customers: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const customers = useSelector((state: RootState) => state.db.customers);
  const orders = useSelector((state: RootState) => state.db.orders);

  const [search, setSearch] = useState('');
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);

  const [walletAmount, setWalletAmount] = useState('');
  const [walletDesc, setWalletDesc] = useState('');
  const [showWalletAdjust, setShowWalletAdjust] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustId);

  // Filter orders related to customer
  const customerOrders = orders.filter(o => o.customerId === selectedCustId);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleToggleBlock = (id: string, name: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Blocked' ? 'Active' : 'Blocked';
    dispatch(updateCustomerStatus({ id, status: nextStatus }));

    dispatch(addNotification({
      title: 'Customer Status Altered',
      description: `${name} has been ${nextStatus.toLowerCase()} from ordering.`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `${nextStatus} customer ${name} (ID: ${id})`,
      module: 'Customers',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  const handleWalletAdjustSubmit = (isCredit: boolean) => {
    if (!selectedCustomer || !walletAmount || !walletDesc) return;
    const value = parseFloat(walletAmount);
    if (isNaN(value)) return;

    const amount = isCredit ? value : -value;

    dispatch(adjustCustomerWallet({
      id: selectedCustomer.id,
      amount,
      description: walletDesc
    }));

    dispatch(addNotification({
      title: 'Customer Wallet Adjust',
      description: `Adjusted ${selectedCustomer.name}'s wallet by $${amount.toFixed(2)}`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Wallet adjustment for ${selectedCustomer.name}: $${amount.toFixed(2)}. Desc: ${walletDesc}`,
      module: 'Customers',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    setWalletAmount('');
    setWalletDesc('');
    setShowWalletAdjust(false);
  };

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
          Customer Registry
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Monitor customer order history profiles, configure wallet ledgers, and manage security blocks
        </Typography>
      </Box>

      {/* Filters card */}
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
                Showing {filteredCustomers.length} registered customers
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Grid of Users */}
      <TableContainer component={Card}>
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
            {filteredCustomers.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{c.name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  ${c.walletBalance.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                  {c.rewardPoints} pts
                </TableCell>
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
                    <IconButton size="small" color="primary" onClick={() => setSelectedCustId(c.id)}>
                      <Eye size={17} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color={c.status === 'Blocked' ? 'success' : 'error'}
                      onClick={() => handleToggleBlock(c.id, c.name, c.status)}
                    >
                      {c.status === 'Blocked' ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />}
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Customer Detail Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedCustId)}
        onClose={() => { setSelectedCustId(null); setShowWalletAdjust(false); }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 3 } }}
      >
        {selectedCustomer && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', overflowY: 'auto' }}>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
                Customer Profile
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Registered details and past transaction summaries for <strong>{selectedCustomer.name}</strong>
              </Typography>
            </Box>

            <Divider />

            {/* Quick Stats */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
                      <Wallet size={16} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Wallet Balance</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>${selectedCustomer.walletBalance.toFixed(2)}</Typography>
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
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedCustomer.rewardPoints} pts</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Wallet Adjust Buttons */}
            <Box>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setShowWalletAdjust(!showWalletAdjust)}
                startIcon={<Wallet size={14} />}
              >
                Adjust Wallet Ledger
              </Button>
            </Box>

            {/* Wallet adjust card */}
            {showWalletAdjust && (
              <Card sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Wallet Credit/Debit Panel</Typography>
                  <TextField
                    size="small"
                    type="number"
                    label="Transaction Amount ($)"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                  />
                  <TextField
                    size="small"
                    label="Adjustment Description"
                    value={walletDesc}
                    onChange={(e) => setWalletDesc(e.target.value)}
                    placeholder="e.g. Campaign credit reward"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button size="small" onClick={() => setShowWalletAdjust(false)}>Cancel</Button>
                    <Button size="small" variant="contained" color="error" startIcon={<Minus size={13} />} onClick={() => handleWalletAdjustSubmit(false)}>Debit</Button>
                    <Button size="small" variant="contained" color="success" startIcon={<Plus size={13} />} onClick={() => handleWalletAdjustSubmit(true)}>Credit</Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Addresses list */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontFamily: 'Outfit' }}>Delivery Addresses</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedCustomer.addresses.map((addr, idx) => (
                  <Box key={idx} sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                    <Typography variant="body2">{addr}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Favorites items */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Heart size={16} color={theme.palette.error.main} fill={theme.palette.error.main} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>Favorite Items</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedCustomer.favoriteItems.map(item => (
                  <Chip key={item} label={item} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>

            {/* Past orders list */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <ShoppingBag size={16} color={theme.palette.secondary.main} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                  Purchase History ({customerOrders.length})
                </Typography>
              </Box>
              {customerOrders.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No orders found for this customer.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {customerOrders.map(o => (
                    <Box 
                      key={o.id}
                      sx={{ 
                        p: 1.5, 
                        border: `1px solid ${theme.palette.divider}`, 
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          #{o.id.split('-')[1]}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {new Date(o.createdAt).toLocaleDateString()} | {o.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>${o.total.toFixed(2)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default Customers;
