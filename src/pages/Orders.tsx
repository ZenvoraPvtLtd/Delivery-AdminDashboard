import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Button, 
  Drawer, Divider, Select, MenuItem, FormControl, InputLabel, 
  TextField, Grid, LinearProgress, useTheme, Alert, Tooltip
} from '@mui/material';
import { 
  Search, Eye, Printer, UserCheck, XCircle, RotateCcw, Compass, MapPin, 
  Bike, Calendar, CreditCard, DollarSign, Store, ShoppingBag
} from 'lucide-react';
import { 
  RootState, updateOrderStatus, assignRider, refundOrder, 
  addAuditLog, addNotification 
} from '../store';
import { Order, DeliveryPartner } from '../store';

const Orders: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { activeOutletId, mode } = useSelector((state: RootState) => state.ui);
  const { orders, deliveryPartners, outlets } = useSelector((state: RootState) => state.db);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Order['status']>('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | Order['paymentStatus']>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [showRefundInput, setShowRefundInput] = useState(false);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  
  // Find delivery partner for the selected order if assigned
  const assignedRiderInfo = deliveryPartners.find(r => r.id === selectedOrder?.deliveryPartnerId);

  // Filters
  const filteredOrders = orders.filter(o => {
    const matchesOutlet = activeOutletId === 'all' || o.outletId === activeOutletId;
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
                          o.customerPhone.includes(search);
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || o.paymentStatus === paymentFilter;
    
    return matchesOutlet && matchesSearch && matchesStatus && matchesPayment;
  });

  const handleStatusUpdate = (orderId: string, nextStatus: Order['status']) => {
    dispatch(updateOrderStatus({
      id: orderId,
      status: nextStatus,
      updatedBy: currentUser?.name || 'Admin System'
    }));

    dispatch(addNotification({
      title: 'Order Status Shifted',
      description: `Order #${orderId.split('-')[1]} is now ${nextStatus}`,
      type: 'order'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Moved order ${orderId} to status ${nextStatus}`,
      module: 'Orders',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  const handleRiderAssign = (orderId: string, riderId: string) => {
    const rider = deliveryPartners.find(r => r.id === riderId);
    if (!rider) return;

    dispatch(assignRider({
      orderId,
      riderId,
      updatedBy: currentUser?.name || 'Admin System'
    }));

    dispatch(addNotification({
      title: 'Rider Dispatched',
      description: `${rider.name} assigned to Order #${orderId.split('-')[1]}`,
      type: 'order'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Assigned rider ${rider.name} to order ${orderId}`,
      module: 'Orders',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  const handleRefundSubmit = (orderId: string) => {
    if (!refundReason) return;
    
    dispatch(refundOrder({
      orderId,
      reason: refundReason,
      updatedBy: currentUser?.name || 'Admin System'
    }));

    dispatch(addNotification({
      title: 'Order Refund Processed',
      description: `Refund approved for Order #${orderId.split('-')[1]}`,
      type: 'system'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Refunded order ${orderId}. Reason: ${refundReason}`,
      module: 'Orders',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    setRefundReason('');
    setShowRefundInput(false);
  };

  const handlePrintInvoice = (order: Order) => {
    // Open a simulation receipt window
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const itemsHtml = order.items.map(it => `
      <tr>
        <td style="padding: 5px 0;">${it.quantity}x ${it.name}</td>
        <td style="text-align: right;">$${(it.price * it.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${order.id.split('-')[1]}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 13px; color: #000; padding: 20px; line-height: 1.4; }
            .text-center { text-align: center; }
            .divider { border-bottom: 1px dashed #000; margin: 12px 0; }
            table { width: 100%; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h3>DELIVO CAFE & RESTAURANT</h3>
            <p>${order.outletName}</p>
            <p>Phone: ${order.customerPhone}</p>
          </div>
          <div class="divider"></div>
          <p>Order: #${order.id.split('-')[1]}</p>
          <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
          <p>Type: ${order.orderType} | Paid: ${order.paymentMethod}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left;">Item</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <table>
            <tr><td>Subtotal</td><td style="text-align: right;">$${order.subtotal.toFixed(2)}</td></tr>
            <tr><td>Tax (GST)</td><td style="text-align: right;">$${order.tax.toFixed(2)}</td></tr>
            <tr><td>Delivery Fee</td><td style="text-align: right;">$${order.deliveryCharge.toFixed(2)}</td></tr>
            <tr><td>Packaging</td><td style="text-align: right;">$${order.packagingCharge.toFixed(2)}</td></tr>
            <tr style="color: red;"><td>Discount</td><td style="text-align: right;">-$${order.discount.toFixed(2)}</td></tr>
            <tr style="font-weight: bold; font-size: 15px;"><td>TOTAL</td><td style="text-align: right;">$${order.total.toFixed(2)}</td></tr>
          </table>
          <div class="divider"></div>
          <div class="text-center" style="margin-top: 30px;">
            <p>Thank you for dining with us!</p>
            <p>Powered by DelivoAdmin</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Coordinates helper for GPS tracker animation
  // Kitchen anchor: (40.7128, -74.0060)
  // Customer anchor: (40.7188, -74.0120)
  const getSimulatedMapDetails = () => {
    if (!selectedOrder || !assignedRiderInfo) return null;
    
    // Compute current position relative to endpoints
    const startLat = 40.7128;
    const startLon = -74.0060;
    const endLat = 40.7188;
    const endLon = -74.0120;
    
    const riderLat = assignedRiderInfo.latitude;
    const riderLon = assignedRiderInfo.longitude;

    // Linear percentage mapping
    const latDiffTotal = endLat - startLat;
    const latDiffRider = riderLat - startLat;
    const progress = Math.min(100, Math.max(0, Math.round((latDiffRider / latDiffTotal) * 100)));

    return { progress, riderLat, riderLon };
  };

  const mapDetails = getSimulatedMapDetails();

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
          Order Dispatch Desk
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Manage real-time incoming orders, coordinate kitchen preparations, and track delivery coordinates
        </Typography>
      </Box>

      {/* Filters Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search order ID, Customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search size={16} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={6} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="All">All Statuses</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Preparing">Preparing</MenuItem>
                  <MenuItem value="Ready">Ready</MenuItem>
                  <MenuItem value="Out for Delivery">Out for Delivery</MenuItem>
                  <MenuItem value="Delivered">Delivered</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment</InputLabel>
                <Select
                  value={paymentFilter}
                  label="Payment"
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="All">All Payments</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Unpaid">Unpaid</MenuItem>
                  <MenuItem value="Refunded">Refunded</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Showing {filteredOrders.length} orders
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table Grid */}
      <TableContainer component={Card}>
        <Table sx={{ minWidth: 700 }} size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Outlet / Branch</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer details</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ordered Items</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No matching orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                    #{order.id.split('-')[1]}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Store size={15} color={theme.palette.text.secondary} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.outletName.replace(' Outlet', '').replace(' Kitchen', '')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.customerName}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{order.customerPhone}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {order.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    ${order.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={order.paymentStatus} 
                      size="small"
                      sx={{ 
                        fontWeight: 700, 
                        fontSize: '0.65rem',
                        borderRadius: '6px',
                        bgcolor: 
                          order.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.1)' :
                          order.paymentStatus === 'Unpaid' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                        color:
                          order.paymentStatus === 'Paid' ? 'success.main' :
                          order.paymentStatus === 'Unpaid' ? 'error.main' : 'secondary.main',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={order.status} 
                      size="small"
                      sx={{ 
                        fontWeight: 700, 
                        fontSize: '0.65rem',
                        borderRadius: '6px',
                        bgcolor: 
                          order.status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' :
                          order.status === 'Preparing' ? 'rgba(4, 120, 87, 0.1)' :
                          order.status === 'Ready' ? 'rgba(14, 165, 233, 0.1)' :
                          order.status === 'Out for Delivery' ? 'rgba(79, 70, 229, 0.1)' :
                          order.status === 'Delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color:
                          order.status === 'Pending' ? 'warning.main' :
                          order.status === 'Preparing' ? 'primary.main' :
                          order.status === 'Ready' ? 'info.main' :
                          order.status === 'Out for Delivery' ? 'secondary.main' :
                          order.status === 'Delivered' ? 'success.main' : 'error.main',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View Order Desk Drawer">
                        <IconButton size="small" onClick={() => setSelectedOrderId(order.id)} sx={{ color: 'primary.main' }}>
                          <Eye size={17} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Receipt">
                        <IconButton size="small" onClick={() => handlePrintInvoice(order)}>
                          <Printer size={17} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Slide Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedOrderId)}
        onClose={() => { setSelectedOrderId(null); setShowRefundInput(false); }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 3, borderLeft: `1px solid ${theme.palette.divider}` } }}
      >
        {selectedOrder && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', overflowY: 'auto' }}>
            {/* Header details */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
                  Order Details
                </Typography>
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700, mt: 0.5 }}>
                  #{selectedOrder.id.split('-')[1]}
                </Typography>
              </Box>
              <Chip 
                label={selectedOrder.status} 
                color={
                  selectedOrder.status === 'Delivered' ? 'success' : 
                  selectedOrder.status === 'Cancelled' ? 'error' : 
                  selectedOrder.status === 'Preparing' ? 'primary' : 'warning'
                }
                sx={{ fontWeight: 700, borderRadius: 2 }}
              />
            </Box>

            <Divider />

            {/* Quick Status Control Panel */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontFamily: 'Outfit' }}>
                Transition Prep Stages
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedOrder.status === 'Pending' && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small" 
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'Preparing')}
                  >
                    Accept & Prepare
                  </Button>
                )}
                {selectedOrder.status === 'Preparing' && (
                  <Button 
                    variant="contained" 
                    color="info" 
                    size="small" 
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'Ready')}
                  >
                    Mark Ready
                  </Button>
                )}
                {selectedOrder.status === 'Ready' && selectedOrder.orderType === 'Delivery' && (
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Assign Rider Dispatched</InputLabel>
                    <Select
                      value=""
                      label="Assign Rider Dispatched"
                      onChange={(e) => handleRiderAssign(selectedOrder.id, e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      {deliveryPartners
                        .filter(r => r.status === 'Available')
                        .map(r => (
                          <MenuItem key={r.id} value={r.id}>
                            {r.name} ({r.vehicleType})
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}
                {selectedOrder.status === 'Out for Delivery' && (
                  <Button 
                    variant="contained" 
                    color="success" 
                    size="small" 
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'Delivered')}
                  >
                    Complete Delivery
                  </Button>
                )}
                {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small" 
                    onClick={() => setShowRefundInput(true)}
                    startIcon={<XCircle size={15} />}
                  >
                    Cancel Order
                  </Button>
                )}
              </Box>
            </Box>

            {/* Refund Cancel Input */}
            {showRefundInput && (
              <Card sx={{ bgcolor: mode === 'dark' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)', borderColor: 'error.main' }}>
                <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main' }}>Cancel & Refund Form</Typography>
                  <TextField
                    size="small"
                    label="Reason for cancellation"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    sx={{ bgcolor: 'background.paper' }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button size="small" onClick={() => setShowRefundInput(false)}>Cancel</Button>
                    <Button size="small" variant="contained" color="error" onClick={() => handleRefundSubmit(selectedOrder.id)}>Confirm Cancel</Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Customer Details */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontFamily: 'Outfit' }}>Customer Information</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.customerName}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Phone: {selectedOrder.customerPhone}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Address: {selectedOrder.address}</Typography>
            </Box>

            {/* Live GPS tracking map block */}
            {selectedOrder.status === 'Out for Delivery' && assignedRiderInfo && mapDetails && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Compass size={18} color={theme.palette.secondary.main} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                    Live GPS Tracker (Simulated)
                  </Typography>
                </Box>
                
                {/* Visual grid simulating coordinates */}
                <Box 
                  className={mode === 'dark' ? 'map-grid-bg' : 'map-grid-bg-light'}
                  sx={{ 
                    height: 180, 
                    borderRadius: 4, 
                    border: `1px solid ${theme.palette.divider}`,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    p: 1.5
                  }}
                >
                  {/* Pin kitchen */}
                  <Box sx={{ position: 'absolute', left: '15%', bottom: '25%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <MapPin size={20} color="#047857" fill="#047857" />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, px: 0.5, bgcolor: 'background.paper', borderRadius: 0.5 }}>Kitchen</Typography>
                  </Box>

                  {/* Rider icon animating */}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      left: `${15 + (mapDetails.progress * 0.7)}%`, 
                      bottom: `${25 + (mapDetails.progress * 0.55)}%`,
                      transform: 'translate(-50%, -50%)',
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      zIndex: 2,
                      transition: 'all 3s linear'
                    }}
                  >
                    <Box 
                      className="pulse-indicator-green" 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        bgcolor: 'success.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Bike size={16} color="white" />
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, px: 0.5, bgcolor: 'background.paper', borderRadius: 0.5, mt: 0.2 }}>
                      {assignedRiderInfo.name}
                    </Typography>
                  </Box>

                  {/* Pin customer */}
                  <Box sx={{ position: 'absolute', right: '15%', top: '20%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <MapPin size={20} color="#0D9488" fill="#0D9488" />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, px: 0.5, bgcolor: 'background.paper', borderRadius: 0.5 }}>Customer</Typography>
                  </Box>
                  
                  <Box sx={{ zIndex: 3, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="caption" sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 0.8, py: 0.2, borderRadius: 0.5 }}>
                      Lat: {mapDetails.riderLat.toFixed(4)}
                    </Typography>
                    <Typography variant="caption" sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 0.8, py: 0.2, borderRadius: 0.5 }}>
                      Lon: {mapDetails.riderLon.toFixed(4)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, textAlign: 'center' }}>
                  Simulated GPS tracker shifts positions automatically every 4 seconds.
                </Typography>
              </Box>
            )}

            {/* Ordered Items list */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontFamily: 'Outfit' }}>Ordered Items</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedOrder.items.map((it, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          border: `1.5px solid ${it.isVeg ? 'green' : 'red'}`,
                          borderRadius: 0.2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: 0.3
                        }}
                      >
                        <Box sx={{ width: 4, height: 4, bgcolor: it.isVeg ? 'green' : 'red', borderRadius: '50%' }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {it.quantity}x {it.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      ${(it.price * it.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider />

            {/* Cost Breakdown */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${selectedOrder.subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>GST Tax</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${selectedOrder.tax.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Delivery Fee</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${selectedOrder.deliveryCharge.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Packaging Fee</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${selectedOrder.packagingCharge.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
                <Typography variant="body2">Campaign Coupon Discount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>-${selectedOrder.discount.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <Typography variant="body2">Final Total</Typography>
                <Typography variant="body2" sx={{ color: 'primary.main', fontSize: '1rem' }}>${selectedOrder.total.toFixed(2)}</Typography>
              </Box>
            </Box>

            <Divider />

            {/* Timeline */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, fontFamily: 'Outfit' }}>Order Log Timeline</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedOrder.timeline.map((step, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5 }} />
                      {idx < selectedOrder.timeline.length - 1 && (
                        <Box sx={{ width: 2, flexGrow: 1, bgcolor: theme.palette.divider, my: 0.5 }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{step.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{step.description}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Button 
                fullWidth 
                variant="outlined" 
                color="secondary"
                startIcon={<Printer size={18} />}
                onClick={() => handlePrintInvoice(selectedOrder)}
                sx={{ borderRadius: 2, py: 1 }}
              >
                Print Restaurant Invoice
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default Orders;
