import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, IconButton, Divider, Tooltip, Alert, Tabs, Tab, Avatar,
  InputLabel, FormControl, Select, MenuItem, useTheme, Modal, 
  CircularProgress, Badge, Paper
} from '@mui/material';
import { 
  Search, Eye, MessageSquare, Phone, RefreshCcw, CheckCircle, 
  XCircle, Clock, Download, ArrowUpRight, BarChart2, ListTodo, 
  AlertTriangle, Check, X, ShieldAlert, Send, Calendar, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  RootState, addNotification, addAuditLog, fetchDb,
  updateOrderConfirmation, addNotificationLog, addConversationLog
} from '../store';

const OrderConfirmationCenter: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const orders = useSelector((state: RootState) => state.db.orders);
  const notifications = useSelector((state: RootState) => state.db.notifications || []);
  const conversations = useSelector((state: RootState) => state.db.conversations || []);
  const communicationSettings = useSelector((state: RootState) => state.db.communicationSettings);

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0: Orders Console, 1: Analytics Dashboard, 2: Notification Logs
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('7days'); // today, yesterday, 7days, 30days, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Selected details modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  
  // Chat simulator state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [simChannel, setSimChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [simText, setSimText] = useState('');
  const [sendingSim, setSendingSim] = useState(false);

  // Analytics Cards & Chart state
  const [kpiCards, setKpiCards] = useState<any>({
    total: 0, pending: 0, confirmed: 0, cancelled: 0,
    waDelivered: 0, smsDelivered: 0, waFailed: 0, smsFailed: 0,
    awaitingReply: 0, avgConfirmTime: 0, confirmationRate: 0
  });
  const [analyticsData, setAnalyticsData] = useState<any>({
    waSuccessRate: 100, smsSuccessRate: 100, cancellationReasons: []
  });

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  // Load database and setup Socket.IO
  const loadData = () => {
    dispatch(fetchDb());
    axios.get('/api/analytics/order-confirmation')
      .then(res => {
        setKpiCards(res.data.cards);
        setAnalyticsData(res.data.analytics);
      })
      .catch(err => console.error('Failed to load confirmation analytics:', err));
  };

  useEffect(() => {
    loadData();

    // Socket.IO hook
    const io = (window as any).io;
    const socket = io ? io() : null;

    if (socket) {
      console.log('[Socket] Subscribed to Live Updates in Confirmation Hub');
      socket.on('order_confirmation_updated', (updatedOrder: any) => {
        dispatch(updateOrderConfirmation(updatedOrder));
        // Refresh analytics periodically
        axios.get('/api/analytics/order-confirmation').then(res => setKpiCards(res.data.cards));
      });
      socket.on('new_notification', (newNotif: any) => {
        dispatch(addNotificationLog(newNotif));
        
        // Show local Mui toast notifications if relevant
        if (newNotif.type === 'system' && !newNotif.read) {
          dispatch(addNotification({
            title: newNotif.title,
            description: newNotif.description,
            type: 'system'
          }));
        }
      });
      socket.on('new_chat', (msg: any) => {
        dispatch(addConversationLog(msg));
        // Append to active chat modal if open
        setChatHistory(prev => {
          if (prev.length > 0 && prev[0].order_id === msg.order_id) {
            // Avoid duplicate additions
            if (!prev.some(c => c.id === msg.id)) {
              return [...prev, msg];
            }
          }
          return prev;
        });
      });
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [dispatch]);

  // Retrieve chat history when chat modal opens
  useEffect(() => {
    if (chatOrderId) {
      axios.get(`/api/orders/conversations/${chatOrderId}`)
        .then(res => setChatHistory(res.data))
        .catch(err => console.error(err));
    }
  }, [chatOrderId]);

  // Filter logic for Orders table
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Must be an order that went through the confirmation system
      if (!o.confirmation_requested_at) return false;

      // Search matches
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        o.id.toLowerCase().includes(searchLower) ||
        o.customerName.toLowerCase().includes(searchLower) ||
        o.customerPhone.includes(searchLower) ||
        (o.customerReply && o.customerReply.toLowerCase().includes(searchLower));

      // Status filters
      let matchesStatus = true;
      if (statusFilter === 'Pending') matchesStatus = o.confirmation_status === 'Pending';
      else if (statusFilter === 'Confirmed') matchesStatus = o.confirmation_status === 'Confirmed';
      else if (statusFilter === 'Cancelled') matchesStatus = o.confirmation_status === 'Cancelled';
      else if (statusFilter === 'Awaiting Reply') matchesStatus = o.confirmation_status === 'Pending';
      else if (statusFilter === 'SMS Failed') {
        const orderNotifs = notifications.filter((n: any) => n.order_id === o.id);
        matchesStatus = orderNotifs.some((n: any) => n.provider === 'twilio' && n.status === 'failed');
      } else if (statusFilter === 'WhatsApp Failed') {
        const orderNotifs = notifications.filter((n: any) => n.order_id === o.id);
        matchesStatus = orderNotifs.some((n: any) => n.provider === 'meta' && n.status === 'failed');
      }

      // Date filters
      let matchesDate = true;
      const createdAtTime = new Date(o.createdAt).getTime();
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      if (dateFilter === 'today') {
        matchesDate = createdAtTime >= startOfDay;
      } else if (dateFilter === 'yesterday') {
        const startOfYesterday = startOfDay - 24 * 60 * 60 * 1000;
        matchesDate = createdAtTime >= startOfYesterday && createdAtTime < startOfDay;
      } else if (dateFilter === '7days') {
        matchesDate = createdAtTime >= (now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === '30days') {
        matchesDate = createdAtTime >= (now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        const startLimit = new Date(customStartDate).getTime();
        const endLimit = new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000;
        matchesDate = createdAtTime >= startLimit && createdAtTime <= endLimit;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, notifications, search, statusFilter, dateFilter, customStartDate, customEndDate]);

  // Handle Operations Action Dispatches
  const handleForceConfirm = (orderId: string) => {
    axios.post('/api/orders/confirm', { orderId })
      .then(() => {
        dispatch(addNotification({
          title: 'Order Force Confirmed',
          description: `Order #${orderId.split('-')[1]} confirmed manually by Admin.`,
          type: 'order'
        }));
        loadData();
      })
      .catch(err => console.error(err));
  };

  const handleForceCancel = (orderId: string) => {
    const reason = prompt('Specify Cancellation Reason:', 'Admin Forced Cancel');
    if (reason === null) return; // cancelled prompt
    
    axios.post('/api/orders/cancel', { orderId, reason })
      .then(() => {
        dispatch(addNotification({
          title: 'Order Cancelled',
          description: `Order #${orderId.split('-')[1]} was marked as Cancelled.`,
          type: 'order'
        }));
        loadData();
      })
      .catch(err => console.error(err));
  };

  const handleResend = (orderId: string, channel: 'whatsapp' | 'sms' | 'both') => {
    axios.post('/api/orders/resend', { orderId, channel })
      .then(() => {
        dispatch(addNotification({
          title: 'Confirmation Resent',
          description: `Resending instructions via ${channel.toUpperCase()}`,
          type: 'system'
        }));
      })
      .catch(err => console.error(err));
  };

  // Simulators: Fast-Forward Time
  const handleTimeLeap = (orderId: string, hours: number) => {
    axios.post('/api/orders/simulate-time-leap', { orderId, hours })
      .then(res => {
        dispatch(addNotification({
          title: 'Time Fast-Forwarded',
          description: `Simulated ${hours} hours passing for Order #${orderId.split('-')[1]}. Check timeline.`,
          type: 'system'
        }));
        loadData();
      })
      .catch(err => console.error(err));
  };

  // Simulator: Customer Reply via Webhook
  const handleSendSimChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim() || !chatOrderId) return;

    setSendingSim(true);
    const order = orders.find(o => o.id === chatOrderId);
    const endpoint = simChannel === 'whatsapp' ? '/api/webhook/whatsapp' : '/api/webhook/sms';
    
    axios.post(endpoint, {
      From: order?.customerPhone || '+1 555-0100',
      Body: simText.trim()
    })
    .then(() => {
      setSimText('');
      setSendingSim(false);
      // Reload details to ensure states sync
      loadData();
    })
    .catch(err => {
      console.error(err);
      setSendingSim(false);
    });
  };

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Customer Name,Phone Number,WhatsApp Status,SMS Status,Customer Reply,Status,Source,Requested Time,Confirmed Time,Cancelled Time\n";

    filteredOrders.forEach(o => {
      const row = [
        o.id,
        o.customerName,
        `"${o.customerPhone}"`,
        o.confirmation_status === 'Confirmed' ? 'Delivered' : 'Awaiting',
        'Delivered', // Sms status
        `"${o.customer_reply || ''}"`,
        o.status,
        o.confirmation_source || 'None',
        o.confirmation_requested_at || '',
        o.confirmed_at || '',
        o.cancelled_at || ''
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OrderConfirmationData_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render analytics charts datasets dynamically
  const dailyTrendsData = useMemo(() => {
    // Generate simulated last 7 days metrics
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      data.push({
        date: dateStr,
        'Confirmation %': parseFloat((75 + Math.sin(i) * 15).toFixed(0)),
        'Cancellation %': parseFloat((15 - Math.sin(i) * 8).toFixed(0)),
        'Reply Speed (m)': parseFloat((12 - i).toFixed(1))
      });
    }
    return data;
  }, []);

  return (
    <Box>
      {/* Upper Panel Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Order Confirmation Desk
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Automated customer approvals, failover logs, timelines, and gateway traffic controls
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={loadData} sx={{ borderRadius: 2 }}>
            Refresh Desk
          </Button>
          <Button variant="contained" startIcon={<Download size={16} />} onClick={handleExportCSV} color="primary" sx={{ borderRadius: 2 }}>
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3} lg={2.4}>
          <Card sx={{ bgcolor: 'rgba(27,38,59,0.3)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}>Total Handled Orders</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>{kpiCards.total}</Typography>
                <Avatar sx={{ bgcolor: 'rgba(255,107,0,0.1)', color: '#FF6B00', width: 40, height: 40 }}>
                  <ListTodo size={20} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3} lg={2.4}>
          <Card sx={{ bgcolor: 'rgba(27,38,59,0.3)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}>Pending Reply</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'warning.main' }}>{kpiCards.pending}</Typography>
                <Avatar sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: 'warning.main', width: 40, height: 40 }}>
                  <Clock size={20} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={2.4}>
          <Card sx={{ bgcolor: 'rgba(27,38,59,0.3)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}>Confirmed Orders</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'success.main' }}>{kpiCards.confirmed}</Typography>
                <Avatar sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: 'success.main', width: 40, height: 40 }}>
                  <CheckCircle size={20} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={2.4}>
          <Card sx={{ bgcolor: 'rgba(27,38,59,0.3)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}>Cancelled Orders</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'error.main' }}>{kpiCards.cancelled}</Typography>
                <Avatar sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: 'error.main', width: 40, height: 40 }}>
                  <XCircle size={20} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={2.4}>
          <Card sx={{ bgcolor: 'rgba(27,38,59,0.3)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}>Confirmation Rate</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'primary.main' }}>{kpiCards.confirmationRate}%</Typography>
                <Avatar sx={{ bgcolor: 'rgba(27,67,50,0.1)', color: 'primary.main', width: 40, height: 40 }}>
                  <ArrowUpRight size={20} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Layout */}
      <Card sx={{ background: 'rgba(18,26,47,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1 }}>
            <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)} textColor="primary" indicatorColor="primary">
              <Tab label="Approval Desk Console" icon={<ListTodo size={16} />} iconPosition="start" sx={{ py: 2, fontWeight: 600 }} />
              <Tab label="Analytics Dashboard" icon={<BarChart2 size={16} />} iconPosition="start" sx={{ py: 2, fontWeight: 600 }} />
              <Tab label="SMS & WhatsApp logs" icon={<Terminal size={16} />} iconPosition="start" sx={{ py: 2, fontWeight: 600 }} />
            </Tabs>
          </Box>

          {/* Tab 0: Orders Console */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              {/* Filters Panel */}
              <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
                <Grid item xs={12} sm={4} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search Order ID, name, reply..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: <Search size={16} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={6} sm={2.5} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                      <MenuItem value="All">All Statuses</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Confirmed">Confirmed</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                      <MenuItem value="Awaiting Reply">Awaiting Reply</MenuItem>
                      <MenuItem value="SMS Failed">SMS Failed</MenuItem>
                      <MenuItem value="WhatsApp Failed">WhatsApp Failed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={2.5} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Range</InputLabel>
                    <Select value={dateFilter} label="Range" onChange={e => setDateFilter(e.target.value)}>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="yesterday">Yesterday</MenuItem>
                      <MenuItem value="7days">Last 7 Days</MenuItem>
                      <MenuItem value="30days">Last 30 Days</MenuItem>
                      <MenuItem value="custom">Custom Date</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {dateFilter === 'custom' && (
                  <>
                    <Grid item xs={6} sm={2} md={1.5}>
                      <TextField fullWidth size="small" type="date" label="Start" InputLabelProps={{ shrink: true }} value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
                    </Grid>
                    <Grid item xs={6} sm={2} md={1.5}>
                      <TextField fullWidth size="small" type="date" label="End" InputLabelProps={{ shrink: true }} value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
                    </Grid>
                  </>
                )}
                <Grid item xs={12} sm={dateFilter === 'custom' ? 12 : 3} md={dateFilter === 'custom' ? 12 : 5} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Found {filteredOrders.length} records
                  </Typography>
                </Grid>
              </Grid>

              {/* Data Table */}
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phone Number</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>WhatsApp Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>SMS Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer Reply</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Order Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Created Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                          No matching confirmation workflow found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map(o => {
                        // Gather communication status for WhatsApp and SMS from local notification logs
                        const orderNotifs = notifications.filter((n: any) => n.order_id === o.id);
                        const waNotif = orderNotifs.find((n: any) => n.provider === communicationSettings?.whatsappProvider);
                        const smsNotif = orderNotifs.find((n: any) => n.provider === communicationSettings?.smsProvider);

                        return (
                          <TableRow key={o.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                              #{o.id.split('-')[1]}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{o.customerName}</TableCell>
                            <TableCell>{o.customerPhone}</TableCell>
                            <TableCell>
                              <Chip 
                                size="small"
                                label={waNotif ? waNotif.status.toUpperCase() : 'NOT SENT'}
                                sx={{ 
                                  fontWeight: 700, fontSize: '0.65rem', borderRadius: '4px',
                                  bgcolor: 
                                    waNotif?.status === 'delivered' || waNotif?.status === 'read' ? 'rgba(16,185,129,0.1)' :
                                    waNotif?.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                                  color: 
                                    waNotif?.status === 'delivered' || waNotif?.status === 'read' ? 'success.main' :
                                    waNotif?.status === 'failed' ? 'error.main' : 'text.secondary'
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                size="small"
                                label={smsNotif ? smsNotif.status.toUpperCase() : 'NOT SENT'}
                                sx={{ 
                                  fontWeight: 700, fontSize: '0.65rem', borderRadius: '4px',
                                  bgcolor: 
                                    smsNotif?.status === 'delivered' ? 'rgba(16,185,129,0.1)' :
                                    smsNotif?.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                                  color: 
                                    smsNotif?.status === 'delivered' ? 'success.main' :
                                    smsNotif?.status === 'failed' ? 'error.main' : 'text.secondary'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {o.customer_reply || '-'}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                size="small"
                                label={o.status}
                                sx={{ 
                                  fontWeight: 700, fontSize: '0.65rem', borderRadius: '6px',
                                  bgcolor: 
                                    o.status === 'Pending' ? 'rgba(245,158,11,0.1)' :
                                    o.status === 'Preparing' ? 'rgba(4,120,87,0.1)' :
                                    o.status === 'Cancelled' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                  color:
                                    o.status === 'Pending' ? 'warning.main' :
                                    o.status === 'Preparing' ? 'primary.main' :
                                    o.status === 'Cancelled' ? 'error.main' : 'success.main'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ textTransform: 'capitalize' }}>{o.confirmation_source || '-'}</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              {new Date(o.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <Tooltip title="View Order Timeline">
                                  <IconButton size="small" color="primary" onClick={() => setSelectedOrderId(o.id)}>
                                    <Eye size={16} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Simulate Chat & Webhook Replies">
                                  <IconButton size="small" color="secondary" onClick={() => { setChatOrderId(o.id); setChatOpen(true); }}>
                                    <MessageSquare size={16} />
                                  </IconButton>
                                </Tooltip>
                                {o.confirmation_status === 'Pending' && (
                                  <>
                                    <Tooltip title="Resend Notification Template">
                                      <IconButton size="small" color="info" onClick={() => handleResend(o.id, 'both')}>
                                        <RefreshCcw size={16} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Force Confirm (Admin Override)">
                                      <IconButton size="small" sx={{ color: 'success.main' }} onClick={() => handleForceConfirm(o.id)}>
                                        <Check size={16} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Force Cancel (Admin Override)">
                                      <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => handleForceCancel(o.id)}>
                                        <X size={16} />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 1: Analytics Dashboard */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={4}>
                {/* 1. Daily Confirmation Rates Area Chart */}
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontFamily: 'Outfit' }}>Daily Confirmation Trends</Typography>
                  <Box sx={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="confirmColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="cancelColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Area type="monotone" dataKey="Confirmation %" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#confirmColor)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Cancellation %" stroke={theme.palette.error.main} fillOpacity={1} fill="url(#cancelColor)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                {/* 2. Provider success rate Bar chart */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontFamily: 'Outfit' }}>Carrier Delivery Handshake Success</Typography>
                  <Box sx={{ height: 300, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>WhatsApp Delivery Success Rate</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'success.main', mt: 1 }}>
                          {analyticsData.waSuccessRate}%
                        </Typography>
                      </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>SMS Gateway Success Rate</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'info.main', mt: 1 }}>
                          {analyticsData.smsSuccessRate}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>

                {/* 3. Average confirmation time bar chart */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontFamily: 'Outfit' }}>Average Customer Response Speed</Typography>
                  <Box sx={{ height: 280, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" />
                        <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                        <ChartTooltip />
                        <Legend />
                        <Bar dataKey="Reply Speed (m)" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                {/* 4. Cancellation reasons pie chart */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontFamily: 'Outfit' }}>Cancellation Causes Distribution</Typography>
                  <Box sx={{ height: 280, width: '100%', display: 'flex', alignItems: 'center' }}>
                    <ResponsiveContainer width="60%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.cancellationReasons || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="reason"
                        >
                          <Cell fill="#FF6B00" />
                          <Cell fill="#EF4444" />
                          <Cell fill="#F59E0B" />
                          <Cell fill="#6366F1" />
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {(analyticsData.cancellationReasons || []).map((entry: any, index: number) => {
                        const colors = ["#FF6B00", "#EF4444", "#F59E0B", "#6366F1"];
                        return (
                          <Box key={entry.reason} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: colors[index % colors.length] }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{entry.reason} ({entry.count})</Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 2: Logs tab */}
          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5, fontFamily: 'Outfit' }}>System Outbox Gateway Logs</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Log ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Channel / Provider</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Delivery State</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Retry Count</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Sent Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Delivery Confirmation</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Provider Feedback</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>No gateway packets logged.</TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((n: any) => (
                        <TableRow key={n.id} hover>
                          <TableCell sx={{ fontFamily: 'Courier New', fontSize: '0.75rem', fontWeight: 600 }}>{n.id.split('-')[1] || n.id}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>#{n.order_id.split('-')[1] || n.order_id}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>
                            <Chip size="small" label={`${n.provider || 'SMS'}`} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              size="small"
                              label={n.status}
                              color={
                                n.status === 'delivered' || n.status === 'read' ? 'success' :
                                n.status === 'failed' ? 'error' : 'warning'
                              }
                              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>{n.retry_count || 0}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{new Date(n.sent_at).toLocaleTimeString()}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{n.delivered_at ? new Date(n.delivered_at).toLocaleTimeString() : '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'Courier New', color: n.status === 'failed' ? 'error.main' : 'text.secondary' }}>
                            {n.provider_response || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 1. Modal: Timeline view */}
      <Dialog open={selectedOrderId !== null} onClose={() => setSelectedOrderId(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Order confirmation Timeline
          <IconButton onClick={() => setSelectedOrderId(null)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedOrder && (
            <Box>
              <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <Typography variant="body2"><strong>Customer:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone})</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>Order Total:</strong> ₹{selectedOrder.total.toFixed(2)}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>Destination Address:</strong> {selectedOrder.address}</Typography>
              </Box>

              {/* Time Leap Simulator Control inside Detail Modal */}
              {selectedOrder.confirmation_status === 'Pending' && (
                <Box sx={{ mb: 4, p: 2, border: '1px dashed #FF6B00', borderRadius: 2, bgcolor: 'rgba(255, 107, 0, 0.03)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#FF6B00', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <AlertTriangle size={14} /> SIMULATOR: Fast-Forward Order Time Policy
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button size="small" variant="outlined" color="primary" onClick={() => handleTimeLeap(selectedOrder.id, 2.1)}>
                      Leap +2 Hours (Reminder 1)
                    </Button>
                    <Button size="small" variant="outlined" color="primary" onClick={() => handleTimeLeap(selectedOrder.id, 6.1)}>
                      Leap +6 Hours (Reminder 2)
                    </Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleTimeLeap(selectedOrder.id, 24.1)}>
                      Leap +24 Hours (Expire)
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Timeline pipeline */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, position: 'relative', pl: 3, '&::before': { content: '""', position: 'absolute', left: 11, top: 4, bottom: 4, width: '2px', bgcolor: 'divider' } }}>
                {selectedOrder.timeline.map((step: any, index: number) => (
                  <Box key={index} sx={{ position: 'relative' }}>
                    <Box sx={{ 
                      position: 'absolute', left: -27, top: 2, width: 16, height: 16, borderRadius: '50%', 
                      bgcolor: step.status.includes('Confirmed') ? 'success.main' : step.status.includes('Cancelled') || step.status.includes('Failed') || step.status.includes('Expired') ? 'error.main' : 'primary.main',
                      border: '4px solid #0A0F1D', zIndex: 2
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{step.title || step.status}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>{step.description}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mt: 0.5 }}>
                      {new Date(step.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. Modal: Chat simulator and webhook reply */}
      <Dialog open={chatOpen} onClose={() => { setChatOpen(false); setChatOrderId(null); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          Interactive Customer Conversations Simulator
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: 500, display: 'flex' }}>
          {/* Chat thread */}
          <Box sx={{ width: '60%', display: 'flex', flexDirection: 'column', bgcolor: 'rgba(0,0,0,0.15)' }}>
            <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {chatHistory.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                  No messages exchanged for this order.
                </Box>
              ) : (
                chatHistory.map((chat: any) => {
                  const isOutgoing = chat.direction === 'outgoing';
                  return (
                    <Box 
                      key={chat.id} 
                      sx={{ 
                        alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        bgcolor: isOutgoing ? 'rgba(255, 107, 0, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        border: isOutgoing ? '1px solid rgba(255, 107, 0, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 3.5,
                        px: 2.5, py: 1.5
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: isOutgoing ? 'primary.main' : 'text.primary' }}>
                        {chat.message}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.5, fontSize: '0.65rem' }}>
                        {new Date(chat.timestamp).toLocaleTimeString()} via {chat.provider.toUpperCase()}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {/* Webhook Response simulator Panel */}
          <Box sx={{ width: '40%', p: 3, borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Terminal size={16} color="#FF6B00" /> Webhooks Callback Simulator
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              Simulate an incoming HTTP webhook callback from WhatsApp or SMS provider servers. This parses responses through signature validators and updates order statuses in real-time.
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Simulated Carrier Channel</InputLabel>
              <Select value={simChannel} label="Simulated Carrier Channel" onChange={e => setSimChannel(e.target.value as any)}>
                <MenuItem value="whatsapp">Meta WhatsApp Cloud API Gateway</MenuItem>
                <MenuItem value="sms">Twilio SMS Webhooks Endpoint</MenuItem>
              </Select>
            </FormControl>

            <form onSubmit={handleSendSimChat} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message Text (Type YES or NO to confirm)"
                value={simText}
                onChange={e => setSimText(e.target.value)}
                placeholder="Type YES to confirm order, NO to cancel order, or custom text..."
                helperText="Send 'YES' or 'NO' to verify automatic status transitions"
              />
              <Button 
                type="submit" 
                variant="contained" 
                color="secondary" 
                fullWidth
                disabled={sendingSim || !simText.trim()}
                startIcon={sendingSim ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
              >
                {sendingSim ? 'Invoking Callback...' : 'Trigger Webhook Callback'}
              </Button>
            </form>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default OrderConfirmationCenter;
