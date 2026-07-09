import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Grid, Card, CardContent, Typography, Box, Button, Select, 
  MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, LinearProgress, Alert, useTheme 
} from '@mui/material';
import { 
  BarChart3, FileSpreadsheet, FileDown, DownloadCloud, TrendingUp, 
  Clock, Truck, Users, Percent, Landmark
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, Legend, CartesianGrid 
} from 'recharts';
import { RootState, addAuditLog } from '../store';

const ReportsAnalytics: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [reportType, setReportType] = useState('Sales');
  const [exportFormat, setExportFormat] = useState('Excel');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  // Analytics datasets
  const deliveryPerformance = [
    { hour: '11:00', prepTime: 12, deliveryTime: 18 },
    { hour: '13:00', prepTime: 15, deliveryTime: 22 },
    { hour: '15:00', prepTime: 10, deliveryTime: 16 },
    { hour: '17:00', prepTime: 11, deliveryTime: 19 },
    { hour: '19:00', prepTime: 18, deliveryTime: 26 },
    { hour: '21:00', prepTime: 14, deliveryTime: 21 },
  ];

  const repeatCustomersData = [
    { name: 'Week 1', newCust: 320, repeatCust: 110 },
    { name: 'Week 2', newCust: 280, repeatCust: 140 },
    { name: 'Week 3', newCust: 310, repeatCust: 185 },
    { name: 'Week 4', newCust: 350, repeatCust: 240 },
  ];

  const handleExportSubmit = () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setCompileProgress(0);
    setDownloadSuccess('');

    const interval = setInterval(() => {
      setCompileProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsCompiling(false);
            const ext = exportFormat === 'Excel' ? 'xlsx' : exportFormat === 'PDF' ? 'pdf' : 'csv';
            setDownloadSuccess(`Successfully compiled and downloaded DELIVO_${reportType.toUpperCase()}_REPORT.${ext}`);
            
            // Add audit log
            dispatch(addAuditLog({
              username: currentUser?.email || 'Simulator Client',
              role: currentUser?.role || 'Guest',
              action: `Exported ${reportType} report as ${exportFormat}`,
              module: 'Reports',
              ipAddress: '127.0.0.1',
              browser: 'Admin Console'
            }));
          }, 500);
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
          Reports & Business Intelligence
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Export operational tables and analyze delivery efficiency timelines
        </Typography>
      </Box>

      {downloadSuccess && (
        <Alert severity="success" sx={{ mb: 3.5, borderRadius: 2 }}>
          {downloadSuccess}
        </Alert>
      )}

      <Grid container spacing={3.5} sx={{ mb: 4 }}>
        {/* Compiler Form */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DownloadCloud size={22} color={theme.palette.primary.main} />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Compile Reports
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Select report target and format settings to execute database compilation.
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Report Dataset</InputLabel>
                <Select
                  value={reportType}
                  label="Report Dataset"
                  onChange={(e) => setReportType(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Sales">Sales Ledger & Revenue</MenuItem>
                  <MenuItem value="Orders">Order Items & Timelines</MenuItem>
                  <MenuItem value="Customers">Customer Demographics & Wallets</MenuItem>
                  <MenuItem value="Inventory">Raw Materials & Alerts</MenuItem>
                  <MenuItem value="Delivery">Rider Efficiency & Coordinates</MenuItem>
                  <MenuItem value="GST">GST Tax Splits & Invoices</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>File Format</InputLabel>
                <Select
                  value={exportFormat}
                  label="File Format"
                  onChange={(e) => setExportFormat(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Excel">Microsoft Excel (.xlsx)</MenuItem>
                  <MenuItem value="CSV">Comma Separated Values (.csv)</MenuItem>
                  <MenuItem value="PDF">Portable Document Format (.pdf)</MenuItem>
                </Select>
              </FormControl>

              {isCompiling && (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Compiling tables... {compileProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={compileProgress} sx={{ borderRadius: 1, height: 6 }} />
                </Box>
              )}

              <Button 
                variant="contained" 
                color="primary"
                onClick={handleExportSubmit}
                disabled={isCompiling}
                startIcon={<FileDown size={18} />}
                sx={{ mt: 1, borderRadius: 2, py: 1.2 }}
              >
                Compile & Download
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Highlight Stats */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={2.5}>
            {[
              { title: 'Average Order Value (AOV)', value: '$28.45', icon: <Landmark size={20} />, trend: '+4.2% month-over-month', color: '#047857' },
              { title: 'Avg Preparation Time', value: '11.8 mins', icon: <Clock size={20} />, trend: '-1.5 mins from last week', color: '#10B981' },
              { title: 'Avg Delivery Time', value: '20.2 mins', icon: <Truck size={20} />, trend: 'Healthy response transit', color: '#0D9488' },
              { title: 'Repeat Customer Rate', value: '42.6%', icon: <Users size={20} />, trend: 'Loyalty campaigns performing', color: '#F59E0B' }
            ].map((stat, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Card>
                  <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: stat.color }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>{stat.title}</Typography>
                      <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.2 }}>{stat.value}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>{stat.trend}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Advanced charts */}
      <Grid container spacing={3.5}>
        {/* Delivery response split chart */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 3 }}>
                Operational Duration Analysis (Minutes)
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={deliveryPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="hour" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: 8 }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.85rem' }} />
                    <Line type="monotone" dataKey="prepTime" name="Prep Time" stroke="#047857" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="deliveryTime" name="Rider Transit" stroke="#0D9488" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Repeat vs New Customer Cohorts */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 3 }}>
                Customer Retention Cohorts (Weekly)
              </Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repeatCustomersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: 8 }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.85rem' }} />
                    <Bar dataKey="newCust" name="Acquisitions" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="repeatCust" name="Returning Users" fill="#047857" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsAnalytics;
