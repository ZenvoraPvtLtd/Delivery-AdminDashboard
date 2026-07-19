import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Switch, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, FormControl, InputLabel, Select, 
  MenuItem, FormControlLabel, Checkbox, Tabs, Tab, Alert, useTheme, 
  ListItemText, Divider, LinearProgress, CircularProgress, Pagination
} from '@mui/material';
import { 
  Plus, Edit2, Trash2, Download, Upload, UtensilsCrossed, 
  Check, AlertTriangle, FileSpreadsheet, Hourglass
} from 'lucide-react';
import { addNotification } from '../store';
import { productService, PaginatedProducts } from '../services/productService';
import { Product } from '../store'; // Adjust import if needed

const Products: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const size = 10;

  const [activeTab, setActiveTab] = useState(0); // 0: Products List, 1: Shift-Based Menu Mappings
  const [menuSchedule, setMenuSchedule] = useState<'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Late Night'>('All');
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [vegFilter, setVegFilter] = useState('All');

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Add/Edit product states
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Fast Food');
  const [prodSubcategory, setProdSubcategory] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDiscount, setProdDiscount] = useState('0');
  const [prodPrepTime, setProdPrepTime] = useState('10');
  const [prodGst, setProdGst] = useState('5');
  const [prodIsVeg, setProdIsVeg] = useState(true);
  const [prodBestSeller, setProdBestSeller] = useState(false);
  const [prodDesc, setProdDesc] = useState('');
  const [prodOutlets, setProdOutlets] = useState<string[]>(['out-1']);

  // Bulk operation states
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'importing' | 'completed'>('idle');

  // We hardcode categories for now, but ideally fetch from DB.
  const categories = ['All', 'Fast Food', 'Italian', 'Salads', 'Beverages', 'Breakfast', 'Snacks'];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts(page, size, debouncedSearch, categoryFilter, vegFilter, menuSchedule);
      setProducts(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedSearch, categoryFilter, vegFilter, menuSchedule]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleAvailability = async (id: string, current: boolean, name: string) => {
    try {
      await productService.toggleAvailability(id, !current);
      dispatch(addNotification({
        title: 'Menu Availability Shifted',
        description: `${name} set to ${!current ? 'Available' : 'Sold Out'}`,
        type: 'stock'
      }));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (prod: Product) => {
    setEditProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setProdSubcategory(prod.subcategory || '');
    setProdPrice(prod.price.toString());
    setProdDiscount(prod.discount.toString());
    setProdPrepTime(prod.preparationTime.toString());
    setProdGst(prod.gstRate.toString());
    setProdIsVeg(prod.isVeg);
    setProdBestSeller(prod.isBestSeller);
    setProdDesc(prod.description || '');
    setProdOutlets(prod.outletIds);
    setProductModalOpen(true);
  };

  const handleNewClick = () => {
    setEditProduct(null);
    setProdName('');
    setProdCategory('Fast Food');
    setProdSubcategory('');
    setProdPrice('');
    setProdDiscount('0');
    setProdPrepTime('10');
    setProdGst('5');
    setProdIsVeg(true);
    setProdBestSeller(false);
    setProdDesc('');
    setProdOutlets(['out-1']);
    setProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;

    const formattedProduct = {
      name: prodName,
      category: prodCategory,
      subcategory: prodSubcategory || prodCategory,
      selling_price: parseFloat(prodPrice),
      discount: parseFloat(prodDiscount) || 0,
      availability: editProduct ? editProduct.availability : true,
      preparation_time: parseInt(prodPrepTime) || 10,
      is_veg: prodIsVeg,
      is_best_seller: prodBestSeller,
      image: editProduct ? editProduct.image : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      outlet_ids: prodOutlets,
      gst: parseInt(prodGst) || 5,
      description: prodDesc
    };

    try {
      if (editProduct) {
        await productService.updateProduct(editProduct.id, formattedProduct);
      } else {
        await productService.createProduct(formattedProduct);
      }

      dispatch(addNotification({
        title: editProduct ? 'Product Settings Saved' : 'New Product Registered',
        description: `${prodName} successfully updated in main catalog.`,
        type: 'system'
      }));

      setProductModalOpen(false);
      setEditProduct(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name} from the central inventory?`)) {
      try {
        await productService.deleteProduct(id);
        dispatch(addNotification({
          title: 'Product Removed',
          description: `${name} deleted from food menu registry.`,
          type: 'system'
        }));
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBulkUpload = () => {
    setBulkStatus('importing');
    setBulkProgress(0);
    
    const interval = setInterval(() => {
      setBulkProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setBulkStatus('completed');
          
          dispatch(addNotification({
            title: 'Bulk Import Completed',
            description: 'Successfully cataloged items from bulk template spreadsheet.',
            type: 'system'
          }));
          
          setTimeout(() => {
            setBulkOpen(false);
            fetchData();
          }, 1500);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <Box>
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Central Menu & Products Registry
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Update product parameters, configure veg/non-veg tags, and schedule shift-based menus
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => setBulkOpen(true)}
            startIcon={<Upload size={16} />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Bulk Actions
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleNewClick}
            startIcon={<Plus size={16} />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Add New Item
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3.5, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Products Roster" sx={{ fontWeight: 600, fontFamily: 'Outfit', fontSize: '1rem' }} />
          <Tab label="Menu Time-Shift Mappings" sx={{ fontWeight: 600, fontFamily: 'Outfit', fontSize: '1rem' }} />
        </Tabs>
        
        {activeTab === 0 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="Search by name, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ width: 260 }}
              />
              <FormControl size="small" sx={{ width: 160 }}>
                <InputLabel>Category</InputLabel>
                <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
                  {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ width: 140 }}>
                <InputLabel>Dietary</InputLabel>
                <Select value={vegFilter} label="Dietary" onChange={(e) => setCategoryFilter(e.target.value)}>
                  <MenuItem value="All">All types</MenuItem>
                  <MenuItem value="Veg">Vegetarian</MenuItem>
                  <MenuItem value="Non-Veg">Non-Veg</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer>
              {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Item Details</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Selling Price</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Kitchen Prep</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((prod) => (
                      <TableRow key={prod.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box 
                              component="img" 
                              src={prod.image}
                              sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover' }}
                            />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {prod.isVeg ? (
                                  <Box sx={{ width: 12, height: 12, border: '1px solid green', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'green' }} />
                                  </Box>
                                ) : (
                                  <Box sx={{ width: 12, height: 12, border: '1px solid red', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'red' }} />
                                  </Box>
                                )}
                                {prod.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>ID: {prod.id.slice(0,8)}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={prod.category} size="small" sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ${prod.price.toFixed(2)}
                          {prod.discount > 0 && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'success.main', fontWeight: 600 }}>
                              -{prod.discount}% Off
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <UtensilsCrossed size={14} />
                            <Typography variant="body2">{prod.preparationTime} min</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Switch 
                            checked={prod.availability} 
                            color="success" 
                            size="small"
                            onChange={() => handleToggleAvailability(prod.id, prod.availability, prod.name)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleEditClick(prod)} color="primary">
                            <Edit2 size={16} />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteProduct(prod.id, prod.name)} color="error">
                            <Trash2 size={16} />
                          </IconButton>
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
          </Box>
        )}
        
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Alert severity="info" icon={<Hourglass size={20} />} sx={{ mb: 3 }}>
              Map your products to specific time windows. Products not mapped to an active shift will be hidden from customer apps during that time.
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              {['All', 'Breakfast', 'Lunch', 'Dinner', 'Late Night'].map((shift) => (
                <Button 
                  key={shift}
                  variant={menuSchedule === shift ? 'contained' : 'outlined'}
                  onClick={() => setMenuSchedule(shift as any)}
                  sx={{ borderRadius: 6, px: 3 }}
                >
                  {shift}
                </Button>
              ))}
            </Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
              {products.length} Products configured for {menuSchedule} shift
            </Typography>
            <Grid container spacing={2}>
              {products.map(prod => (
                <Grid item xs={12} sm={6} md={4} key={prod.id}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, pb: '12px !important' }}>
                      <Box component="img" src={prod.image} sx={{ width: 40, height: 40, borderRadius: 1 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{prod.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{prod.category}</Typography>
                      </Box>
                      <Check size={18} color="green" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Card>

      <Dialog open={productModalOpen} onClose={() => setProductModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700, pb: 1 }}>
          {editProduct ? 'Modify Menu Item' : 'Add New Menu Item'}
        </DialogTitle>
        <Divider />
        <form onSubmit={handleProductSubmit}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={8}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Core Identification</Typography>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField label="Product Name" fullWidth size="small" value={prodName} onChange={(e) => setProdName(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Category</InputLabel>
                        <Select value={prodCategory} label="Category" onChange={(e) => setProdCategory(e.target.value)}>
                          {categories.filter(c => c !== 'All').map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Subcategory" fullWidth size="small" value={prodSubcategory} onChange={(e) => setProdSubcategory(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Description" fullWidth multiline rows={2} size="small" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Pricing Strategy</Typography>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField label="Base Selling Price" type="number" fullWidth size="small" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Discount (%)" type="number" fullWidth size="small" value={prodDiscount} onChange={(e) => setProdDiscount(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Tax / GST (%)" type="number" fullWidth size="small" value={prodGst} onChange={(e) => setProdGst(e.target.value)} />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Kitchen & Compliance</Typography>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField label="Prep Time (minutes)" type="number" fullWidth size="small" value={prodPrepTime} onChange={(e) => setProdPrepTime(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControlLabel control={<Checkbox checked={prodIsVeg} onChange={(e) => setProdIsVeg(e.target.checked)} />} label="Vegetarian" />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <FormControlLabel control={<Checkbox checked={prodBestSeller} onChange={(e) => setProdBestSeller(e.target.checked)} />} label="Mark as Best Seller Badge" />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button onClick={() => setProductModalOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ textTransform: 'none', borderRadius: 2 }}>
              {editProduct ? 'Save Changes' : 'Publish Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={bulkOpen} onClose={() => setBulkStatus('idle') === undefined && setBulkOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Bulk Operations Wizard</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
          {bulkStatus === 'idle' && (
            <>
              <Alert severity="info">Download our standardized CSV template to bulk upload or edit thousands of products at once.</Alert>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<Download size={18} />} fullWidth sx={{ py: 1.5, borderRadius: 2 }}>
                  Download CSV Template
                </Button>
                <Button variant="contained" startIcon={<FileSpreadsheet size={18} />} fullWidth onClick={handleBulkUpload} sx={{ py: 1.5, borderRadius: 2 }}>
                  Upload Completed CSV
                </Button>
              </Box>
            </>
          )}

          {bulkStatus === 'importing' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Hourglass size={48} color={theme.palette.primary.main} style={{ animation: 'spin 2s linear infinite' }} />
              <Typography variant="h6" sx={{ mt: 2, fontFamily: 'Outfit' }}>Validating & Importing Rows...</Typography>
              <LinearProgress variant="determinate" value={bulkProgress} sx={{ mt: 3, height: 8, borderRadius: 4 }} />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>{bulkProgress}% Completed</Typography>
            </Box>
          )}

          {bulkStatus === 'completed' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'success.light', color: 'success.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <Check size={32} />
              </Box>
              <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Import Successful!</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>18 new items have been added to the master inventory catalog.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkOpen(false)} disabled={bulkStatus === 'importing'}>Close Window</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
