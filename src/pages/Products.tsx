import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Switch, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, FormControl, InputLabel, Select, 
  MenuItem, FormControlLabel, Checkbox, Tabs, Tab, Alert, useTheme, 
  ListItemText, Divider, LinearProgress
} from '@mui/material';
import { 
  Plus, Edit2, Trash2, Download, Upload, UtensilsCrossed, 
  Check, AlertTriangle, FileSpreadsheet, Hourglass
} from 'lucide-react';
import { RootState, addEditProduct, deleteProduct, toggleProductAvailability, addAuditLog, addNotification } from '../store';
import { Product } from '../store';

const Products: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const products = useSelector((state: RootState) => state.db.products);
  const outlets = useSelector((state: RootState) => state.db.outlets);

  const [activeTab, setActiveTab] = useState(0); // 0: Products List, 1: Shift-Based Menu Mappings
  const [menuSchedule, setMenuSchedule] = useState<'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Late Night'>('All');
  
  const [search, setSearch] = useState('');
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

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesVeg = vegFilter === 'All' || 
                       (vegFilter === 'Veg' && p.isVeg) || 
                       (vegFilter === 'Non-Veg' && !p.isVeg);
    
    // Shift menu mapping filters
    const matchesSchedule = menuSchedule === 'All' ||
      (menuSchedule === 'Breakfast' && ['Breakfast', 'Beverages'].includes(p.category)) ||
      (menuSchedule === 'Lunch' && ['Fast Food', 'Italian', 'Salads', 'Beverages'].includes(p.category)) ||
      (menuSchedule === 'Dinner' && ['Fast Food', 'Italian', 'Salads', 'Snacks', 'Beverages'].includes(p.category)) ||
      (menuSchedule === 'Late Night' && ['Fast Food', 'Snacks', 'Beverages'].includes(p.category));

    return matchesSearch && matchesCat && matchesVeg && matchesSchedule;
  });

  const handleToggleAvailability = (id: string) => {
    dispatch(toggleProductAvailability(id));
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    dispatch(addNotification({
      title: 'Menu Availability Shifted',
      description: `${prod.name} set to ${!prod.availability ? 'Available' : 'Sold Out'}`,
      type: 'stock'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Toggled availability for product ${prod.name} to ${!prod.availability}`,
      module: 'Products',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  const handleEditClick = (prod: Product) => {
    setEditProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setProdSubcategory(prod.subcategory);
    setProdPrice(prod.price.toString());
    setProdDiscount(prod.discount.toString());
    setProdPrepTime(prod.preparationTime.toString());
    setProdGst(prod.gstRate.toString());
    setProdIsVeg(prod.isVeg);
    setProdBestSeller(prod.isBestSeller);
    setProdDesc(prod.description);
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

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;

    const formattedProduct: Product = {
      id: editProduct ? editProduct.id : `prod-${Date.now().toString().slice(-3)}`,
      name: prodName,
      category: prodCategory,
      subcategory: prodSubcategory || prodCategory,
      price: parseFloat(prodPrice),
      discount: parseFloat(prodDiscount) || 0,
      availability: editProduct ? editProduct.availability : true,
      preparationTime: parseInt(prodPrepTime) || 10,
      isVeg: prodIsVeg,
      isBestSeller: prodBestSeller,
      image: editProduct ? editProduct.image : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      outletIds: prodOutlets,
      gstRate: parseInt(prodGst) || 5,
      description: prodDesc
    };

    dispatch(addEditProduct(formattedProduct));

    dispatch(addNotification({
      title: editProduct ? 'Product Settings Saved' : 'New Product Registered',
      description: `${prodName} successfully updated in main catalog.`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `${editProduct ? 'Updated' : 'Created'} product ${prodName}`,
      module: 'Products',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    setProductModalOpen(false);
    setEditProduct(null);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name} from the central inventory?`)) {
      dispatch(deleteProduct(id));

      dispatch(addNotification({
        title: 'Product Removed',
        description: `${name} deleted from food menu registry.`,
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: `Deleted product ${name} (ID: ${id})`,
        module: 'Products',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));
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
            description: 'Successfully cataloged 18 items from bulk template spreadsheet.',
            type: 'system'
          }));

          dispatch(addAuditLog({
            username: currentUser?.email || 'Simulator Client',
            role: currentUser?.role || 'Guest',
            action: 'Bulk Uploaded Products via CSV',
            module: 'Products',
            ipAddress: '127.0.0.1',
            browser: 'Admin Console'
          }));
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <Box>
      {/* Title */}
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
            sx={{ 
              borderRadius: 2,
              fontWeight: 600,
              fontFamily: 'Outfit',
              borderWidth: '1.5px',
              '&:hover': {
                borderWidth: '1.5px',
                bgcolor: 'rgba(27, 67, 50, 0.05)'
              }
            }}
          >
            Bulk Actions
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleNewClick}
            startIcon={<Plus size={16} />}
            sx={{ borderRadius: 2 }}
          >
            Register Product
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={(e, val) => setActiveTab(val)} 
        sx={{ mb: 3.5, borderBottom: `1px solid ${theme.palette.divider}` }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Food Menu Inventory" sx={{ fontWeight: 700 }} />
        <Tab label="Shift & Outlet Scheduling" sx={{ fontWeight: 700 }} />
      </Tabs>

      {activeTab === 0 ? (
        // TAB 1: Main Product List
        <Box>
          {/* Filters card */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search product, descriptions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Category"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Diet Format</InputLabel>
                    <Select
                      value={vegFilter}
                      label="Diet Format"
                      onChange={(e) => setVegFilter(e.target.value)}
                    >
                      <MenuItem value="All">All Diet formats</MenuItem>
                      <MenuItem value="Veg">Vegetarian Only</MenuItem>
                      <MenuItem value="Non-Veg">Non-Vegetarian Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {filteredProducts.length} Items registered
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Products Table */}
          <TableContainer component={Card}>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Food Item</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Base Price</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Discount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Prep Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Sell Tags</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box 
                          component="img" 
                          src={p.image} 
                          sx={{ width: 44, height: 44, borderRadius: 2, objectFit: 'cover' }} 
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
                            {p.isVeg ? (
                              <Chip label="Veg" size="small" color="success" sx={{ height: 16, fontSize: '0.6rem', borderRadius: 0.5 }} />
                            ) : (
                              <Chip label="Non-Veg" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem', borderRadius: 0.5 }} />
                            )}
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>GST: {p.gstRate}%</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${p.price.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {p.discount > 0 ? (
                        <Chip label={`${p.discount}% OFF`} color="primary" size="small" sx={{ fontWeight: 700, height: 18, fontSize: '0.65rem' }} />
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>None</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Hourglass size={12} color={theme.palette.text.secondary} />
                        <Typography variant="body2">{p.preparationTime}m</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {p.isBestSeller && (
                        <Chip label="Bestseller" color="secondary" size="small" sx={{ fontWeight: 700, height: 18, fontSize: '0.65rem' }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={p.availability}
                            onChange={() => handleToggleAvailability(p.id)}
                            color="success"
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ fontWeight: 700, color: p.availability ? 'success.main' : 'error.main' }}>
                            {p.availability ? 'Active' : 'Sold Out'}
                          </Typography>
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleEditClick(p)}>
                          <Edit2 size={15} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteProduct(p.id, p.name)}>
                          <Trash2 size={15} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        // TAB 2: Shift / Scheduler configuration
        <Box>
          <Grid container spacing={3.5}>
            {/* Shift Scheduler Selector */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                    Shift Configuration
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Setup automatic hours schedules for dishes. Items mapped to breakfast will auto-pause after morning shift transitions.
                  </Typography>

                  <FormControl fullWidth>
                    <InputLabel>Active Service Shift</InputLabel>
                    <Select
                      value={menuSchedule}
                      label="Active Service Shift"
                      onChange={(e) => setMenuSchedule(e.target.value as any)}
                    >
                      <MenuItem value="All">Full Time (All Service hours)</MenuItem>
                      <MenuItem value="Breakfast">Breakfast hours (06:00 AM - 11:30 AM)</MenuItem>
                      <MenuItem value="Lunch">Lunch hours (11:30 AM - 04:30 PM)</MenuItem>
                      <MenuItem value="Dinner">Dinner hours (04:30 PM - 11:00 PM)</MenuItem>
                      <MenuItem value="Late Night">Late Night hours (11:00 PM - 03:00 AM)</MenuItem>
                    </Select>
                  </FormControl>

                  <Divider />
                  
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Roster Statistics</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Currently rendering {filteredProducts.length} items mapped to the <strong>{menuSchedule}</strong> shift configuration.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* List Mapped Dishes */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 2 }}>
                    Scheduled Dishes ({menuSchedule})
                  </Typography>
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Food Item</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Availability Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredProducts.map((p) => (
                          <TableRow key={p.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{p.name}</TableCell>
                            <TableCell>{p.category}</TableCell>
                            <TableCell>
                              <Chip 
                                label={p.availability ? 'Active Shift' : 'Disabled'} 
                                size="small" 
                                color={p.availability ? 'success' : 'default'}
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Add / Edit product dialog */}
      <Dialog open={productModalOpen} onClose={() => setProductModalOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 480 } }}>
        <form onSubmit={handleProductSubmit}>
          <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>
            {editProduct ? 'Edit Catalog Product' : 'Register New Product'}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Dish Name"
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={prodCategory}
                    label="Category"
                    onChange={(e) => setProdCategory(e.target.value)}
                  >
                    <MenuItem value="Breakfast">Breakfast</MenuItem>
                    <MenuItem value="Fast Food">Fast Food</MenuItem>
                    <MenuItem value="Italian">Italian</MenuItem>
                    <MenuItem value="Salads">Salads</MenuItem>
                    <MenuItem value="Snacks">Snacks</MenuItem>
                    <MenuItem value="Beverages">Beverages</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Subcategory"
                  value={prodSubcategory}
                  onChange={(e) => setProdSubcategory(e.target.value)}
                  placeholder="e.g. Burgers"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Price ($)"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Discount (%)"
                  value={prodDiscount}
                  onChange={(e) => setProdDiscount(e.target.value)}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Prep Time (mins)"
                  value={prodPrepTime}
                  onChange={(e) => setProdPrepTime(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>GST Tax Rate</InputLabel>
                  <Select
                    value={prodGst}
                    label="GST Tax Rate"
                    onChange={(e) => setProdGst(e.target.value)}
                  >
                    <MenuItem value="5">5% GST (Standard Food)</MenuItem>
                    <MenuItem value="12">12% GST (Beverages/Ready)</MenuItem>
                    <MenuItem value="18">18% GST (Luxury Services)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 3 }}>
              <FormControlLabel
                control={<Checkbox checked={prodIsVeg} onChange={(e) => setProdIsVeg(e.target.checked)} color="success" />}
                label={<Typography variant="body2">Vegetarian Item</Typography>}
              />
              <FormControlLabel
                control={<Checkbox checked={prodBestSeller} onChange={(e) => setProdBestSeller(e.target.checked)} color="secondary" />}
                label={<Typography variant="body2">Flag Bestseller</Typography>}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Dish Description"
              value={prodDesc}
              onChange={(e) => setProdDesc(e.target.value)}
              placeholder="Enter details on spices, allergen warnings, or nutritional facts..."
            />

            <FormControl fullWidth size="small">
              <InputLabel>Mapped Outlets</InputLabel>
              <Select
                multiple
                value={prodOutlets}
                label="Mapped Outlets"
                onChange={(e) => setProdOutlets(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                renderValue={(selected) => selected.map(id => outlets.find(o => o.id === id)?.name.split(' ')[0]).join(', ')}
              >
                {outlets.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    <Checkbox checked={prodOutlets.indexOf(o.id) > -1} />
                    <ListItemText primary={o.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setProductModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editProduct ? 'Save Adjustments' : 'Add to Catalog'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Bulk actions Dialog */}
      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} PaperProps={{ sx: { borderRadius: 3, width: 400 } }}>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Bulk Menu Actions</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Download product ledger templates as sheets, edit prices in bulk, and upload back to the system.
          </Typography>

          <Button 
            variant="outlined" 
            color="secondary" 
            fullWidth
            onClick={() => alert('Simulated CSV catalog template downloaded.')}
            startIcon={<FileSpreadsheet size={18} />}
            sx={{ py: 1.2, borderRadius: 2 }}
          >
            Download CSV Catalog Template
          </Button>

          <Divider sx={{ my: 1 }} />

          {bulkStatus === 'idle' ? (
            <Button 
              variant="contained" 
              color="primary"
              fullWidth
              onClick={handleBulkUpload}
              startIcon={<Upload size={18} />}
              sx={{ py: 1.2, borderRadius: 2 }}
            >
              Simulate CSV File Import
            </Button>
          ) : bulkStatus === 'importing' ? (
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                Uploading sheets... {bulkProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={bulkProgress} sx={{ height: 6, borderRadius: 1 }} />
            </Box>
          ) : (
            <Alert severity="success" sx={{ borderRadius: 2 }} icon={<Check size={18} />}>
              Import catalog records processing successfully.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setBulkOpen(false); setBulkStatus('idle'); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
