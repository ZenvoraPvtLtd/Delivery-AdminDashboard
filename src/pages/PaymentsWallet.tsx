import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, useTheme 
} from '@mui/material';
import { 
  CreditCard, DollarSign, ArrowDownLeft, ArrowUpRight, 
  Layers, CheckCircle2, ShieldCheck, HelpCircle 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { RootState } from '../store';

const PaymentsWallet: React.FC = () => {
  const theme = useTheme();

  const outlets = useSelector((state: RootState) => state.db.outlets);
  const orders = useSelector((state: RootState) => state.db.orders);

  // Settlement charts data
  const gatewayBreakdown = [
    { name: 'UPI Collections', value: 12400, color: '#047857' },
    { name: 'Credit Cards', value: 8900, color: '#0D9488' },
    { name: 'Store Wallet', value: 4300, color: '#10B981' },
    { name: 'Cash On Delivery', value: 2100, color: '#F59E0B' }
  ];

  // Dynamic settlement list
  const transactionLedger = [
    { txId: 'TXN-90141', orderId: 'order-101', customer: 'Marcus Aurelius', gateway: 'UPI', amount: 34.86, type: 'Credit', status: 'Settled', date: '2026-07-09' },
    { txId: 'TXN-90142', orderId: 'order-102', customer: 'Clara Oswald', gateway: 'Card', amount: 24.02, type: 'Credit', status: 'Settled', date: '2026-07-09' },
    { txId: 'TXN-90143', orderId: 'order-104', customer: 'Peter Parker', gateway: 'Wallet', amount: 24.64, type: 'Credit', status: 'Settled', date: '2026-07-09' },
    { txId: 'TXN-90144', orderId: 'order-104', customer: 'Peter Parker', gateway: 'Refund', amount: 5.00, type: 'Debit', status: 'Settled', date: '2026-07-09' }
  ];

  const totalCollected = gatewayBreakdown.reduce((sum, g) => sum + g.value, 0);

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
          Financial Settlement & Gateway Audit
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          View daily collections logs, configure refund settlements, and monitor gateway allocations
        </Typography>
      </Box>

      {/* Stats summary cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>Gross Collections</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800, mt: 0.5 }}>
                ${totalCollected.toLocaleString()}
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
                $420.50 Approved
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>12 cases processed this week</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>Bank Settlement Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>Completed</Typography>
                <ShieldCheck size={18} color={theme.palette.success.main} />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Next sweep scheduled: 12:00 AM</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3.5} sx={{ mb: 4 }}>
        {/* Gateway splits bar chart */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 3 }}>
                Gateway Collection Allocations ($)
              </Typography>
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gatewayBreakdown} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                    <XAxis type="number" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: 8 }} />
                    <Bar dataKey="value" name="Value ($)" fill="#047857" radius={[0, 4, 4, 0]}>
                      {gatewayBreakdown.map((entry, idx) => (
                        <TableCell key={idx} sx={{ bgcolor: entry.color }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Outlet collections table */}
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

      {/* Transaction log */}
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
                {transactionLedger.map((tx) => (
                  <TableRow key={tx.txId} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{tx.txId}</TableCell>
                    <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>#{tx.orderId.split('-')[1]}</TableCell>
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
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentsWallet;
