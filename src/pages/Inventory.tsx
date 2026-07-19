import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, FormControl, InputLabel, Select, MenuItem, Alert, useTheme, IconButton,
  CircularProgress, Pagination
} from '@mui/material';
import { 
  Boxes, AlertTriangle, Plus, Minus, FilePlus2, 
  Truck, ArrowUpDown, Calendar, HelpCircle 
} from 'lucide-react';
import { addNotification } from '../store';
import { inventoryService, InventoryItem, PurchaseOrder } from '../services/inventoryService';

const Inventory: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [rawMaterials, setRawMaterials] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const size = 10;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  
  const [poOpen, setPoOpen] = useState(false);
  const [poItem, setPoItem] = useState('');
  const [poQty, setPoQty] = useState('');
  const [poSupplier, setPoSupplier] = useState('');

  const categories = ['All', 'Dairy', 'Produce', 'Meat', 'Bakery', 'Dry Goods', 'Beverages'];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, poRes] = await Promise.all([
        inventoryService.getInventory(page, size, debouncedSearch, selectedCategory),
        inventoryService.getPurchaseOrders()
      ]);
      setRawMaterials(res.data);
      setTotal(res.total);
      setPurchaseOrders(poRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lowStockItems = rawMaterials.filter(m => m.current_stock < m.min_stock_alert);

  const handleAdjustSubmit = async () => {
    if (!adjustItem || !adjustAmount) return;
    const value = parseFloat(adjustAmount);
    if (isNaN(value)) return;

    try {
      const res = await inventoryService.adjustStock(adjustItem.id, value);
      
      const updatedStock = res.current_stock;
      if (updatedStock >= adjustItem.min_stock_alert && adjustItem.current_stock < adjustItem.min_stock_alert) {
        dispatch(addNotification({
          title: 'Inventory Restocked',
          description: `${adjustItem.name} stock level recovered (${updatedStock.toFixed(1)} ${adjustItem.unit})`,
          type: 'stock'
        }));
      } else {
        dispatch(addNotification({
          title: 'Stock Adjusted',
          description: `${adjustItem.name} is now at ${updatedStock.toFixed(1)} ${adjustItem.unit}`,
          type: 'stock'
        }));
      }

      setAdjustOpen(false);
      setAdjustItem(null);
      setAdjustAmount('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePOSubmit = async () => {
    if (!poItem || !poQty || !poSupplier) return;
    
    try {
      await inventoryService.issuePurchaseOrder(poItem, parseFloat(poQty), poSupplier);
      dispatch(addNotification({
        title: 'Purchase Order Issued',
        description: `Sent PO for ${poQty} of ${poItem} to ${poSupplier}`,
        type: 'stock'
      }));

      setPoOpen(false);
      setPoItem('');
      setPoQty('');
      setPoSupplier('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
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
                    {item.current_stock} {item.unit} remaining (Min: {item.min_stock_alert} {item.unit})
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Alert>
      )}

      <Grid container spacing={3.5}>
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
                {loading ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
                ) : (
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
                      {rawMaterials.map((item) => {
                        const isLow = item.current_stock < item.min_stock_alert;
                        return (
                          <TableRow key={item.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: isLow ? 'error.main' : 'text.primary' }}>
                              {item.current_stock} {item.unit}
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
                                <Typography variant="body2">{item.expiry_date || 'N/A'}</Typography>
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
                )}
              </TableContainer>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Pagination count={Math.ceil(total / size) || 1} page={page} onChange={(_, p) => setPage(p)} color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 3 }}>
                Active Purchase Orders
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {purchaseOrders.length === 0 && !loading && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    No active purchase orders.
                  </Typography>
                )}
                {purchaseOrders.map(po => (
                  <Box key={po.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>PO #{po.id.slice(-6)}</Typography>
                      <Chip 
                        label={po.status} 
                        size="small" 
                        color={po.status === 'Received' ? 'success' : 'primary'}
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 0.5, lineHeight: 1.2 }}>
                      {po.quantity} {po.unit} {po.item_name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1.5 }}>
                      <Truck size={14} />
                      <Typography variant="caption">{po.supplier_name}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      Issued on {po.date}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Adjustment Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Adjust Stock Level</DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Adjusting inventory for <strong>{adjustItem?.name}</strong>. Current level: {adjustItem?.current_stock} {adjustItem?.unit}
          </Typography>
          <TextField
            label="Adjustment Amount (e.g. 5 or -2)"
            type="number"
            fullWidth
            size="small"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            helperText="Use negative numbers to manually deduct stock"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAdjustOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAdjustSubmit} sx={{ textTransform: 'none', borderRadius: 2 }}>
            Confirm Adjustment
          </Button>
        </DialogActions>
      </Dialog>

      {/* PO Dialog */}
      <Dialog open={poOpen} onClose={() => setPoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Create Purchase Order</DialogTitle>
        <DialogContent dividers sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" icon={<HelpCircle size={20} />}>
            Issuing a purchase order will notify the supplier via their registered EDI endpoints.
          </Alert>
          
          <FormControl fullWidth size="small">
            <InputLabel>Material Item</InputLabel>
            <Select value={poItem} label="Material Item" onChange={(e) => setPoItem(e.target.value)}>
              {rawMaterials.map(m => (
                <MenuItem key={m.id} value={m.name}>{m.name} ({m.unit})</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Quantity Requested"
            type="number"
            fullWidth
            size="small"
            value={poQty}
            onChange={(e) => setPoQty(e.target.value)}
          />

          <TextField
            label="Supplier Entity"
            fullWidth
            size="small"
            value={poSupplier}
            onChange={(e) => setPoSupplier(e.target.value)}
            helperText="Leave empty to use default supplier associated with the item"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPoOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handlePOSubmit} sx={{ textTransform: 'none', borderRadius: 2 }}>
            Send PO Authorization
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
