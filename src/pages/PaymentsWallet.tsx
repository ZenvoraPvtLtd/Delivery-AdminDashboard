import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, useTheme, Button,
  CircularProgress
} from '@mui/material';
import { 
  CreditCard, DollarSign, ArrowDownLeft, ArrowUpRight, 
  Layers, CheckCircle2, ShieldCheck, HelpCircle, Download
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { RootState } from '../store';
import { paymentService, DashboardSummary } from '../services/paymentService';

const PaymentsWallet: React.FC = () => {
  const theme = useTheme();

  const outlets = useSelector((state: RootState) => state.db.outlets);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const downloadCSV = () => {
    if (!summary) return;
    
    const rows = [];
    
    // Section 1: Summary Stats
    rows.push(["FINANCIAL SUMMARY"]);
    rows.push(["Gross Collections", `$${summary.gross_collections.toLocaleString()}`]);
    rows.push(["Refund Settlements", `$${summary.refund_settlements_amount} Approved`]);
    rows.push(["Bank Settlement Status", summary.settlement_status]);
    rows.push([]);
    
    // Section 2: Daily Outlet Collections
    rows.push(["DAILY OUTLET COLLECTIONS"]);
    rows.push(["Outlet Branch", "Digital Sales", "Cash Vault", "Settled Payout"]);
    outlets.forEach(o => {
      const digital = (o.revenue * 0.85).toFixed(2);
      const cash = (o.revenue * 0.15).toFixed(2);
      rows.push([o.name, `$${digital}`, `$${cash}`, `$${o.revenue}`]);
    });
    rows.push([]);
    
    // Section 3: Recent Transaction Audit Logs
    rows.push(["RECENT TRANSACTION AUDIT LOGS"]);
    rows.push(["Tx ID", "Order ID", "Customer Name", "Payment Gateway", "Transaction Type", "Amount", "Status", "Date"]);
    summary.recent_transactions.forEach(tx => {
      rows.push([
        tx.txId,
        tx.orderId,
        tx.customer,
        tx.gateway,
        tx.type,
        `${tx.type === 'Credit' ? '+' : '-'}$${tx.amount.toFixed(2)}`,
        tx.status,
        tx.date
      ]);
    });
    
    const csvContent = rows.map(e => e.map(val => `"${val?.toString().replace(/"/g, '""') || ''}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Delivo_Financial_Settlement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Financial Settlement & Gateway Audit
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            View daily collections logs, configure refund settlements, and monitor gateway allocations
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Download size={16} />}
          onClick={downloadCSV}
          disabled={loading || !summary}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Export CSV File
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : summary ? (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>Gross Collections</Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>
                    ${summary.gross_collections.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                    Across all active outlets
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>Refund Settlements</Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>
                    ${summary.refund_settlements_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Approved
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{summary.refund_cases} cases processed</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>Bank Settlement Status</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>{summary.settlement_status}</Typography>
                    <ShieldCheck size={18} color={theme.palette.success.main} />
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Next sweep scheduled: 12:00 AM</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3.5} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 3 }}>
                    Gateway Collection Allocations ($)
                  </Typography>
                  <Box sx={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.gateway_breakdown} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                        <XAxis type="number" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: 8 }} />
                        <Bar dataKey="value" name="Value ($)" fill="#047857" radius={[0, 4, 4, 0]}>
                          {summary.gateway_breakdown.map((entry, idx) => (
                            <TableCell key={idx} sx={{ bgcolor: entry.color }} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 2 }}>
                    Daily Outlet Collections
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Outlet Branch</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Digital Sales</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Cash Vault</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Settled Payout</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {outlets.map((o) => (
                          <TableRow key={o.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{o.name.replace(' Outlet', '').replace(' Cafe', '')}</TableCell>
                            <TableCell align="right">${(o.revenue * 0.85).toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                            <TableCell align="right">${(o.revenue * 0.15).toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                              ${o.revenue.toLocaleString()}
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

          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 2 }}>
                Recent Transaction Audit Logs
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Tx ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payment Gateway</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.recent_transactions.map((tx) => (
                      <TableRow key={tx.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{tx.txId}</TableCell>
                        <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>{tx.orderId}</TableCell>
                        <TableCell>{tx.customer}</TableCell>
                        <TableCell>{tx.gateway}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: tx.type === 'Credit' ? 'success.main' : 'error.main' }}>
                            {tx.type === 'Credit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{tx.type}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: tx.type === 'Credit' ? 'success.main' : 'error.main' }}>
                          {tx.type === 'Credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip label={tx.status} size="small" color="success" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {summary.recent_transactions.length === 0 && (
                      <TableRow>
                         <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>No transactions found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      ) : null}
    </Box>
  );
};

export default PaymentsWallet;
