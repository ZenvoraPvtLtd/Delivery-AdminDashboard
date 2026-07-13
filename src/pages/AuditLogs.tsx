import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, TextField, 
  FormControl, InputLabel, Select, MenuItem, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, useTheme, Button 
} from '@mui/material';
import { Search, Shield, History, Globe, Monitor, FileSpreadsheet } from 'lucide-react';
import { RootState } from '../store';

const AuditLogs: React.FC = () => {
  const theme = useTheme();

  const auditLogs = useSelector((state: RootState) => state.db.auditLogs);

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  const modules = ['All', 'Auth', 'Products', 'Orders', 'Coupons', 'Inventory', 'Complaints', 'Customers', 'Banner Management', 'CMS', 'User Management', 'Role & Permissions', 'Settings', 'RBAC'];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.username.toLowerCase().includes(search.toLowerCase()) || 
                          log.action.toLowerCase().includes(search.toLowerCase()) ||
                          log.ipAddress.includes(search);
    const matchesModule = moduleFilter === 'All' || log.module === moduleFilter;
    
    return matchesSearch && matchesModule;
  });

  const downloadExcel = () => {
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8"/><style>table { border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; font-family: sans-serif; } th { background-color: #107C41; color: white; }</style></head>';
    html += '<body><table><thead><tr>';
    html += '<th>Timestamp</th><th>Admin Operator</th><th>Role Profile</th><th>Action Description</th><th>Module Target</th><th>IP Signature</th><th>Device Agent</th>';
    html += '</tr></thead><tbody>';
    filteredLogs.forEach(log => {
      html += `<tr><td>${new Date(log.timestamp).toLocaleString()}</td><td>${log.username}</td><td>${log.role}</td><td>${log.action}</td><td>${log.module}</td><td>${log.ipAddress}</td><td>${log.browser}</td></tr>`;
    });
    html += '</tbody></table></body></html>';
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Delivo_Audit_Logs_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
          Security Audit Trails
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Monitor administrative logins, configuration modifications, and IP request signatures
        </Typography>
      </Box>

      {/* Filter panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                label="Search admin email, action description, IP address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search size={16} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Module Scope</InputLabel>
                <Select
                  value={moduleFilter}
                  label="Module Scope"
                  onChange={(e) => setModuleFilter(e.target.value)}
                >
                  {modules.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Trace logs: {filteredLogs.length} events
              </Typography>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<FileSpreadsheet size={16} />}
                onClick={downloadExcel}
                sx={{ 
                  borderRadius: 2, 
                  bgcolor: '#107C41',
                  '&:hover': { bgcolor: '#0B592E' },
                  fontWeight: 700 
                }}
              >
                Excel
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <TableContainer component={Card}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Admin Operator</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role Profile</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Action Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Module Target</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>IP Signature</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Device Agent</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(log.timestamp).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{log.username}</TableCell>
                <TableCell>
                  <Chip 
                    label={log.role} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: '0.65rem', borderRadius: '4px' }} 
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: log.action.includes('Success') || log.action.includes('Register') ? 'success.main' : 'text.primary' }}>
                  {log.action}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={log.module} 
                    size="small" 
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} 
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Globe size={13} color={theme.palette.text.secondary} />
                    <Typography variant="body2">{log.ipAddress}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Monitor size={13} color={theme.palette.text.secondary} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{log.browser}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AuditLogs;
