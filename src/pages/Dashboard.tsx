import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Grid, Card, CardContent, Typography, Box, Button, ButtonGroup, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, List, ListItem, ListItemText, LinearProgress, useTheme 
} from '@mui/material';
import { 
  TrendingUp, ShoppingCart, DollarSign, Users, AlertTriangle, 
  Clock, CheckCircle, Navigation, ShieldCheck, Flame
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { RootState, simulateRiderMovement, addNotification, addSimulatedOrder } from '../store';
import StatCard from '../components/StatCard';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { activeOutletId, mode } = useSelector((state: RootState) => state.ui);
  const { orders, products, deliveryPartners, rawMaterials, tickets, outlets } = useSelector((state: RootState) => state.db);

  const [salesTab, setSalesTab] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Trigger GPS Simulator loop for active orders map
  useEffect(() => {
    const gpsTimer = setInterval(() => {
      dispatch(simulateRiderMovement());
    }, 4000);
    return () => clearInterval(gpsTimer);
  }, [dispatch]);

  // Simulate random orders arriving to demonstrate live notification alerts
  useEffect(() => {
    const orderTimer = setInterval(() => {
      // 25% chance of simulating a new order every 8 seconds
      if (Math.random() < 0.25) {
        const randomNames = ['Bruce Banner', 'Diana Prince', 'Clark Kent', 'Steve Rogers', 'Natasha Romanoff'];
        const randomProducts = products.filter(p => p.availability);
        if (randomProducts.length === 0 || outlets.length === 0) return;

        const selectProd = randomProducts[Math.floor(Math.random() * randomProducts.length)];
        const customerName = randomNames[Math.floor(Math.random() * randomNames.length)];
        const randomOutlet = outlets[Math.floor(Math.random() * outlets.length)];
        const randomCustId = `cust-${Math.floor(Math.random() * 5) + 1}`;
        
        const subtotal = selectProd.price;
        const tax = parseFloat((subtotal * (selectProd.gstRate / 100)).toFixed(2));
        const deliveryCharge = 2.99;
        const packagingCharge = 1.50;
        const total = parseFloat((subtotal + tax + deliveryCharge + packagingCharge).toFixed(2));
        
        const orderId = `order-${Date.now().toString().slice(-3)}`;
        
        const newOrder = {
          id: orderId,
          customerId: randomCustId,
          customerName: customerName,
          customerPhone: `+1 555-${Math.floor(1000 + Math.random() * 9000)}`,
          outletId: randomOutlet.id,
          outletName: randomOutlet.name,
          items: [{ productId: selectProd.id, name: selectProd.name, quantity: 1, price: selectProd.price, isVeg: selectProd.isVeg }],
          subtotal,
          tax,
          deliveryCharge,
          packagingCharge,
          discount: 0,
          total,
          status: 'Pending' as const,
          paymentStatus: 'Paid' as const,
          paymentMethod: 'UPI' as const,
          createdAt: new Date().toISOString(),
          address: '124 Simulated Lane, New York, NY',
          timeline: [{ status: 'Pending', timestamp: new Date().toISOString(), title: 'Order Placed', description: 'Order placed via simulated active live stream.' }],
          orderType: 'Delivery' as const
        };

        dispatch(addSimulatedOrder(newOrder));
        
        dispatch(addNotification({
          title: 'New Delivery Order',
          description: `${customerName} ordered ${selectProd.name} ($${selectProd.price.toFixed(2)})`,
          type: 'order'
        }));
      }
    }, 8000);
    
    return () => clearInterval(orderTimer);
  }, [dispatch, products, outlets]);

  // Filters based on chosen outlet in the global switcher
  const filteredOrders = orders.filter(o => activeOutletId === 'all' || o.outletId === activeOutletId);
  const filteredMaterials = rawMaterials; // stock is global inventory
  const filteredOutlets = outlets.filter(o => activeOutletId === 'all' || o.id === activeOutletId);

  // Math totals
  const totalRevenue = filteredOrders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const activeOrdersCount = filteredOrders.filter(o => 
    ['Pending', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status)
  ).length;

  const lowStockCount = filteredMaterials.filter(m => m.stock < m.minStockAlert).length;
  const activeTicketsCount = tickets.filter(t => t.status === 'Open').length;

  // Chart datasets
  const weeklySalesData = [
    { day: 'Mon', sales: 4000, orders: 120 },
    { day: 'Tue', sales: 4500, orders: 140 },
    { day: 'Wed', sales: 5100, orders: 165 },
    { day: 'Thu', sales: 4800, orders: 150 },
    { day: 'Fri', sales: 7200, orders: 230 },
    { day: 'Sat', sales: 9400, orders: 310 },
    { day: 'Sun', sales: 8800, orders: 290 },
  ];

  const dailySalesData = [
    { hour: '08 AM', sales: 600 },
    { hour: '10 AM', sales: 1200 },
    { hour: '12 PM', sales: 2400 },
    { hour: '02 PM', sales: 1800 },
    { hour: '04 PM', sales: 1100 },
    { hour: '06 PM', sales: 2900 },
    { hour: '08 PM', sales: 3800 },
    { hour: '10 PM', sales: 2100 },
  ];

  const monthlySalesData = [
    { month: 'Jan', sales: 68000 },
    { month: 'Feb', sales: 74000 },
    { month: 'Mar', sales: 91000 },
    { month: 'Apr', sales: 85000 },
    { month: 'May', sales: 98000 },
    { month: 'Jun', sales: 112000 },
  ];

  const topProductsData = [
    { name: 'Matcha Latte', value: 45 },
    { name: 'Truffle Burger', value: 30 },
    { name: 'Pepperoni Pizza', value: 15 },
    { name: 'Avocado Toast', value: 10 },
  ];

  const COLORS = ['#1B4332', '#8B5E3C', '#2C7A7B', '#C77B30'];

  const outletPerformanceData = outlets.map(o => ({
    name: o.name.replace(' Outlet', '').replace(' Cafe', '').replace(' Kitchen', ''),
    revenue: o.revenue,
    orders: o.ordersCount
  }));

  const getSalesChartData = () => {
    if (salesTab === 'daily') return dailySalesData;
    if (salesTab === 'monthly') return monthlySalesData;
    return weeklySalesData;
  };

  const getSalesChartKey = () => {
    if (salesTab === 'daily') return 'hour';
    if (salesTab === 'monthly') return 'month';
    return 'day';
  };

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Live performance indicators and kitchen delivery trackers for your outlets.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            icon={<Flame size={14} color="#1B4332" />} 
            label="Live Order Stream Active" 
            variant="outlined"
            sx={{ 
              fontWeight: 600, 
              color: 'primary.main', 
              borderColor: 'primary.main',
              bgcolor: 'rgba(27, 67, 50, 0.05)'
            }} 
          />
        </Box>
      </Box>

      {/* Grid summary cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue (Gross)"
            value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign size={22} />}
            trend="+12.4% from last week"
            trendType="up"
            color="#1B4332"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Dispatch Queue"
            value={activeOrdersCount.toString()}
            icon={<ShoppingCart size={22} />}
            trend={`${filteredOrders.filter(o => o.status === 'Pending').length} pending confirmation`}
            trendType="info"
            color="#2C7A7B"
            isPulse={activeOrdersCount > 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Inventory Items"
            value={lowStockCount.toString()}
            icon={<AlertTriangle size={22} />}
            trend={lowStockCount > 0 ? "Reorder purchase orders due" : "Stock healthy"}
            trendType={lowStockCount > 0 ? "down" : "up"}
            color={lowStockCount > 0 ? "#9B2C2C" : "#2D6A4F"}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Tickets"
            value={activeTicketsCount.toString()}
            icon={<Users size={22} />}
            trend={`${tickets.filter(t => t.priority === 'High' && t.status !== 'Resolved').length} high priority`}
            trendType="neutral"
            color="#C77B30"
          />
        </Grid>
      </Grid>

      {/* Charts section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Main Sales Trend Area Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp size={20} color={theme.palette.primary.main} />
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                    Revenue Analytics
                  </Typography>
                </Box>
                <ButtonGroup size="small" color="primary">
                  <Button variant={salesTab === 'daily' ? 'contained' : 'outlined'} onClick={() => setSalesTab('daily')}>Hourly</Button>
                  <Button variant={salesTab === 'weekly' ? 'contained' : 'outlined'} onClick={() => setSalesTab('weekly')}>Weekly</Button>
                  <Button variant={salesTab === 'monthly' ? 'contained' : 'outlined'} onClick={() => setSalesTab('monthly')}>Monthly</Button>
                </ButtonGroup>
              </Box>

              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getSalesChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B4332" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#1B4332" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey={getSalesChartKey()} stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper, 
                        borderColor: theme.palette.divider,
                        borderRadius: 8,
                        color: theme.palette.text.primary
                      }} 
                    />
                    <Area type="monotone" dataKey="sales" name="Revenue ($)" stroke="#1B4332" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 3 }}>
                Top Selling Products
              </Typography>
              <Box sx={{ width: '100%', height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProductsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {topProductsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper, 
                        borderColor: theme.palette.divider,
                        borderRadius: 8
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {/* Legends list */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                {topProductsData.map((item, index) => (
                  <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: COLORS[index] }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                      {item.value}% shares
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Outlet Performance Bar Chart */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 3 }}>
                Outlet Gross Comparison
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={outletPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper, 
                        borderColor: theme.palette.divider,
                        borderRadius: 8
                      }}
                    />
                    <Bar dataKey="revenue" name="Sales ($)" fill="#2C7A7B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Active Orders Tracker */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Kitchen Prep Queue
                </Typography>
                <Button size="small" variant="text" sx={{ fontWeight: 700 }} href="/orders">
                  Go to Orders desk
                </Button>
              </Box>

              <TableContainer sx={{ maxHeight: 260 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No active kitchen orders
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((o) => (
                        <TableRow key={o.id} hover>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>#{o.id.split('-')[1]}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.customerName}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{o.outletName.replace(' Outlet', '').replace(' Cafe', '')}</Typography>
                          </TableCell>
                          <TableCell>
                            {o.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={o.status} 
                              size="small" 
                              sx={{ 
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                borderRadius: '6px',
                                bgcolor: 
                                  o.status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' :
                                  o.status === 'Preparing' ? 'rgba(27, 67, 50, 0.08)' :
                                  o.status === 'Ready' ? 'rgba(14, 165, 233, 0.1)' :
                                  o.status === 'Out for Delivery' ? 'rgba(44, 122, 123, 0.1)' :
                                  o.status === 'Delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color:
                                  o.status === 'Pending' ? 'warning.main' :
                                  o.status === 'Preparing' ? 'primary.main' :
                                  o.status === 'Ready' ? 'info.main' :
                                  o.status === 'Out for Delivery' ? 'secondary.main' :
                                  o.status === 'Delivered' ? 'success.main' : 'error.main',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
