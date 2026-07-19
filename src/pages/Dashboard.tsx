import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Grid, Card, CardContent, Typography, Box, Button, ButtonGroup, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, CircularProgress, useTheme, Tooltip as MuiTooltip
} from '@mui/material';
import { 
  TrendingUp, ShoppingCart, DollarSign, Users, AlertTriangle, 
  Flame
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { RootState } from '../store';
import StatCard from '../components/StatCard';
import { dashboardService, StatCardData, ChartDataPoint, RecentOrderData } from '../services/dashboardService';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  
  const { mode } = useSelector((state: RootState) => state.ui);

  const [salesTab, setSalesTab] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);
  
  const [cards, setCards] = useState<StatCardData[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderData[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [cardsData, chartsData, ordersData, statusData, notifData] = await Promise.all([
          dashboardService.getCards(),
          dashboardService.getCharts(salesTab),
          dashboardService.getRecentOrders(),
          dashboardService.getSystemStatus(),
          dashboardService.getNotifications()
        ]);
        
        setCards(cardsData || []);
        setChartData(chartsData || null);
        setRecentOrders(ordersData || []);
        setSystemStatus(statusData || null);
        setNotifications(notifData || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [salesTab]);

  const COLORS = ['#1B4332', '#8B5E3C', '#2C7A7B', '#C77B30'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

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
      </Box>

      {/* Grid summary cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card: StatCardData, index: number) => {
          let icon = <TrendingUp size={22} />;
          let color = "#1B4332";
          if (card.title.includes("Revenue")) {
             icon = <DollarSign size={22} />;
             color = "#1B4332";
          } else if (card.title.includes("Dispatch")) {
             icon = <ShoppingCart size={22} />;
             color = "#2C7A7B";
          } else if (card.title.includes("Inventory")) {
             icon = <AlertTriangle size={22} />;
             color = card.trendType === 'down' ? "#9B2C2C" : "#2D6A4F";
          } else if (card.title.includes("Tickets")) {
             icon = <Users size={22} />;
             color = "#C77B30";
          }

          return (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <StatCard
                title={card.title}
                value={card.value}
                icon={icon}
                trend={card.trend}
                trendType={card.trendType}
                color={color}
                isPulse={card.isPulse}
              />
            </Grid>
          )
        })}
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
                {chartData.revenue_chart.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                    No sales data available. Awaiting modules.
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.revenue_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1B4332" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#1B4332" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
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
                )}
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
              
              {chartData.top_products.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: 'text.secondary' }}>
                  No product data.
                </Box>
              ) : (
                <>
                  <Box sx={{ width: '100%', height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.top_products}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.top_products.map((entry: any, index: number) => (
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

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                    {chartData.top_products.map((item: any, index: number) => (
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
                </>
              )}
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
                {chartData.outlet_performance.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                    No outlet data.
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.outlet_performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                )}
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
                    {recentOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No active kitchen orders
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentOrders.map((o: RecentOrderData) => (
                        <TableRow key={o.id} hover>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>#{o.id.split('-')[1] || o.id}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.customer_name}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{o.outlet_name.replace(' Outlet', '').replace(' Cafe', '')}</Typography>
                          </TableCell>
                          <TableCell>
                            {o.items_summary}
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
