import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, FormControl, InputLabel, Select, MenuItem, Alert, useTheme, IconButton
} from '@mui/material';
import { 
  Boxes, AlertTriangle, Plus, Minus, FilePlus2, 
  Truck, ArrowUpDown, Calendar, HelpCircle 
} from 'lucide-react';
import { RootState, adjustRawMaterialStock, addAuditLog, addNotification } from '../store';

const Inventory: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const rawMaterials = useSelector((state: RootState) => state.db.rawMaterials);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<typeof rawMaterials[0] | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  
  const [poOpen, setPoOpen] = useState(false);
  const [poItem, setPoItem] = useState('');
  const [poQty, setPoQty] = useState('');
  const [poSupplier, setPoSupplier] = useState('');

  // Local simulated purchase orders
  const [purchaseOrders, setPurchaseOrders] = useState([
    { id: 'po-501', item: 'Brioche Burger Buns', qty: 100, unit: 'pcs', supplier: 'Daily Bake Shop', status: 'Sent', date: '2026-07-08' },
    { id: 'po-502', item: 'Mozzarella Cheese', qty: 25, unit: 'kg', supplier: 'Metro Dairy Farms', status: 'Received', date: '2026-07-06' }
  ]);

  const categories = ['All', ...Array.from(new Set(rawMaterials.map(m => m.category)))];

  const filteredMaterials = rawMaterials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.supplier.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const lowStockItems = rawMaterials.filter(m => m.stock < m.minStockAlert);

  const handleAdjustSubmit = () => {
    if (!adjustItem || !adjustAmount) return;
    const value = parseFloat(adjustAmount);
    if (isNaN(value)) return;

    dispatch(adjustRawMaterialStock({
      id: adjustItem.id,
      amount: value
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Adjusted inventory stock for ${adjustItem.name} by ${value}`,
      module: 'Inventory',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    // Trigger notification if item goes back above threshold
    const updatedStock = adjustItem.stock + value;
    if (updatedStock >= adjustItem.minStockAlert && adjustItem.stock < adjustItem.minStockAlert) {
      dispatch(addNotification({
        title: 'Inventory Restocked',
        description: `${adjustItem.name} stock level recovered ($${updatedStock.toFixed(1)} ${adjustItem.unit})`,
        type: 'stock'
      }));
    }

    setAdjustOpen(false);
    setAdjustItem(null);
    setAdjustAmount('');
  };

  const handlePOSubmit = () => {
    if (!poItem || !poQty || !poSupplier) return;
    
    const newPO = {
      id: `po-${Date.now().toString().slice(-3)}`,
      item: poItem,
      qty: parseFloat(poQty),
      unit: rawMaterials.find(m => m.name === poItem)?.unit || 'units',
      supplier: poSupplier,
      status: 'Sent',
      date: new Date().toISOString().split('T')[0]
    };

    setPurchaseOrders([newPO, ...purchaseOrders]);

    dispatch(addNotification({
      title: 'Purchase Order Issued',
      description: `Sent PO for ${poQty} of ${poItem} to ${poSupplier}`,
      type: 'stock'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Issued Purchase Order for ${poQty} ${poItem}`,
      module: 'Inventory',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    setPoOpen(false);
    setPoItem('');
    setPoQty('');
    setPoSupplier('');
  };

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Inventory Control Register
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Raw food materials tracking, low stock indicators, and supplier purchase orders logs
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setPoOpen(true)}
          startIcon={<FilePlus2 size={16} />}
          sx={{ borderRadius: 2 }}
        >
          Issue Purchase Order
        </Button>
      </Box>

      {/* Alerts for low stock */}
      {lowStockItems.length > 0 && (
        <Alert 
          severity="error" 
          icon={<AlertTriangle size={20} />} 
          sx={{ mb: 3.5, borderRadius: 2.5, '& .MuiAlert-message': { width: '100%' } }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Low Stock Warning alerts</Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            The following food ingredients have dropped below set minimum operating limits. Reorder lists have been auto-prepared:
          </Typography>
          <Grid container spacing={1.5}>
            {lowStockItems.map(item => (
              <Grid item xs={12} sm={4} key={item.id}>
                <Box sx={{ p: 1, px: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                    {item.stock} {item.unit} remaining (Min: {item.minStockAlert} {item.unit})
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Alert>
      )}

      <Grid container spacing={3.5}>
        {/* Inventory list */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, justifyItems: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                  Ingredients Register
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexGrow: 1, justifyContent: 'flex-end' }}>
                  <TextField
                    size="small"
                    label="Search item/supplier"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ width: 220 }}
                  />
                  <FormControl size="small" sx={{ width: 140 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      label="Category"
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Ingredient</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Stock Level</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Expiry Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Adjust</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMaterials.map((item) => {
                      const isLow = item.stock < item.minStockAlert;
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: isLow ? 'error.main' : 'text.primary' }}>
                            {item.stock} {item.unit}
                            {isLow && (
                              <Typography variant="caption" sx={{ display: 'block', color: 'error.main', fontSize: '0.65rem', fontWeight: 600 }}>
                                Low Stock Alert
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Calendar size={13} color={theme.palette.text.secondary} />
                              <Typography variant="body2">{item.expiryDate}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => { setAdjustItem(item); setAdjustOpen(true); }}
                              >
                                <ArrowUpDown size={15} />
                              </IconButton>
                            </Box>
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

        {/* PO lists */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Truck size={18} color={theme.palette.secondary.main} />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Supplier Purchase Orders
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {purchaseOrders.map((po) => (
                  <Box 
                    key={po.id} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2.5, 
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{po.id}</Typography>
                      <Chip 
                        label={po.status} 
                        size="small" 
                        color={po.status === 'Received' ? 'success' : 'warning'}
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{po.item}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      Qty: {po.qty} {po.unit} | Supplier: {po.supplier}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                      Date Sent: {po.date}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} PaperProps={{ sx: { borderRadius: 3, width: 350 } }}>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>
          Adjust Stock: {adjustItem?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Current Stock: <strong>{adjustItem?.stock} {adjustItem?.unit}</strong>
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Adjustment Amount (e.g. +10 or -5)"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            placeholder="+0.00"
            helperText="Prefix with a minus (-) sign to reduce stock levels"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button onClick={handleAdjustSubmit} variant="contained" color="primary">Save Adjustment</Button>
        </DialogActions>
      </Dialog>

      {/* PO Dialog */}
      <Dialog open={poOpen} onClose={() => setPoOpen(false)} PaperProps={{ sx: { borderRadius: 3, width: 400 } }}>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>New Purchase Order</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Target Ingredient</InputLabel>
            <Select
              value={poItem}
              label="Target Ingredient"
              onChange={(e) => setPoItem(e.target.value)}
            >
              {rawMaterials.map(m => <MenuItem key={m.id} value={m.name}>{m.name} ({m.unit})</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Quantity Order Size"
            value={poQty}
            onChange={(e) => setPoQty(e.target.value)}
          />
          <TextField
            fullWidth
            size="small"
            label="Target Supplier"
            value={poSupplier}
            onChange={(e) => setPoSupplier(e.target.value)}
            placeholder="e.g. Metro Dairy Farms"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPoOpen(false)}>Cancel</Button>
          <Button onClick={handlePOSubmit} variant="contained" color="primary" disabled={!poItem || !poQty || !poSupplier}>
            Issue Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
