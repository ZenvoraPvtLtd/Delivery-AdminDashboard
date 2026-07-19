import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Switch, 
  FormControlLabel, TextField, Alert, LinearProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme, Chip,
  CircularProgress
} from '@mui/material';
import { 
  Settings, Key, Database, RefreshCcw, Save, 
  Server, MessageSquare, Landmark, Map 
} from 'lucide-react';
import { RootState, addAuditLog, addNotification } from '../store';
import { settingsService, BackupResponse } from '../services/settingsService';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);

  // Business Parameters
  const [delFee, setDelFee] = useState('');
  const [packFee, setPackFee] = useState('');
  const [bizHours, setBizHours] = useState('');
  const [saveAlert, setSaveAlert] = useState(false);

  // API switches
  const [apiMaps, setApiMaps] = useState(false);
  const [apiRazorpay, setApiRazorpay] = useState(false);
  const [apiTwilio, setApiTwilio] = useState(false);
  const [apiSmtp, setApiSmtp] = useState(false);

  // Backup states
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupAlert, setBackupAlert] = useState('');
  const [backups, setBackups] = useState<BackupResponse[]>([]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [biz, apis, baks] = await Promise.all([
        settingsService.getBusinessSettings(),
        settingsService.getApiConfigs(),
        settingsService.getBackups()
      ]);
      setDelFee(biz.deliveryFee);
      setPackFee(biz.packagingFee);
      setBizHours(biz.businessHours);

      setApiMaps(apis.googleMaps);
      setApiRazorpay(apis.razorpay);
      setApiTwilio(apis.twilio);
      setApiSmtp(apis.smtp);

      setBackups(baks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveParams = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsService.updateBusinessSettings({
        deliveryFee: delFee,
        packagingFee: packFee,
        businessHours: bizHours
      });
      setSaveAlert(true);
      setTimeout(() => setSaveAlert(false), 3000);

      dispatch(addNotification({
        title: 'Restaurant Parameters Saved',
        description: 'Fee structures and operation hours saved successfully.',
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: 'Saved main business configurations',
        module: 'Settings',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleApi = async (name: string, key: string, val: boolean) => {
    try {
      const res = await settingsService.toggleApiConfig(key, val);
      setApiMaps(res.googleMaps);
      setApiRazorpay(res.razorpay);
      setApiTwilio(res.twilio);
      setApiSmtp(res.smtp);

      dispatch(addNotification({
        title: 'API Integration Updated',
        description: `${name} connectivity flag changed to ${val}`,
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: `Modified API status for ${name} to ${val}`,
        module: 'API Integrations',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerBackup = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    setBackupProgress(0);
    setBackupAlert('');

    try {
      // Intentionally simulating progress bar for UI feel before finalizing
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 25;
        });
      }, 400);

      await new Promise(r => setTimeout(r, 1600)); // wait for progress to fill
      const newBak = await settingsService.triggerBackup();
      setBackups([newBak, ...backups]);
      setBackupAlert('Cloud snapshot archive created and uploaded to AWS S3 bucket.');
      
      dispatch(addNotification({
        title: 'Database Backup Completed',
        description: `Database backup size ${newBak.size} compiled.`,
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: 'Manually triggered system database backup',
        module: 'Backup & Restore',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = (id: string) => {
    if (confirm(`Execute database rollback to snapshot ${id}? Warning: current unsaved database states will reset.`)) {
      dispatch(addNotification({
        title: 'Database Rollback Initiated',
        description: `Restoring tables mapping state to archive ${id}`,
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: `Triggered database restore to snapshot ${id}`,
        module: 'Backup & Restore',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));

      alert('Database rollback completed. Reloading states...');
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
          System Settings & Integrations
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Configure restaurant charge settings, toggle digital payment gateways, and manage database cloud backups
        </Typography>
      </Box>

      {saveAlert && (
        <Alert severity="success" sx={{ mb: 3.5, borderRadius: 2 }}>
          System configurations saved. Updates take effect immediately.
        </Alert>
      )}

      {backupAlert && (
        <Alert severity="success" sx={{ mb: 3.5, borderRadius: 2 }}>
          {backupAlert}
        </Alert>
      )}

      <Grid container spacing={3.5} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Settings size={20} color={theme.palette.primary.main} />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Operation Parameters
                </Typography>
              </Box>

              <form onSubmit={handleSaveParams}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    size="small"
                    label="Standard Delivery Charge ($)"
                    value={delFee}
                    onChange={(e) => setDelFee(e.target.value)}
                    required
                  />
                  <TextField
                    size="small"
                    label="Packaging Surcharge ($)"
                    value={packFee}
                    onChange={(e) => setPackFee(e.target.value)}
                    required
                  />
                  <TextField
                    size="small"
                    label="Service Operating Hours"
                    value={bizHours}
                    onChange={(e) => setBizHours(e.target.value)}
                    required
                  />
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    startIcon={<Save size={16} />}
                    sx={{ borderRadius: 2, py: 1 }}
                  >
                    Save operational settings
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Key size={20} color={theme.palette.secondary.main} />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  API Integrations
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Toggle service bindings with external digital cloud infrastructure services.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={apiMaps} 
                      onChange={(e) => handleToggleApi('Google Maps', 'Google Maps', e.target.checked)}
                      color="success" 
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Map size={16} /> <Typography variant="body2">Google Maps Geocoding</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={apiRazorpay} 
                      onChange={(e) => handleToggleApi('Razorpay Gateway', 'Razorpay Gateway', e.target.checked)}
                      color="success" 
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Landmark size={16} /> <Typography variant="body2">Razorpay Gateway API</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={apiTwilio} 
                      onChange={(e) => handleToggleApi('Twilio SMS', 'Twilio SMS', e.target.checked)}
                      color="success" 
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MessageSquare size={16} /> <Typography variant="body2">Twilio SMS Push Notifications</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={apiSmtp} 
                      onChange={(e) => handleToggleApi('SMTP Email Server', 'SMTP Email Server', e.target.checked)}
                      color="success" 
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Server size={16} /> <Typography variant="body2">SMTP Relay email dispatch</Typography>
                    </Box>
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Database size={20} color={theme.palette.success.main} />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Backup & Disaster Recovery
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Manually compile system tables states and write to cloud archive.
              </Typography>

              {isBackingUp ? (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Compiling tables structures... {backupProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={backupProgress} sx={{ height: 6, borderRadius: 1 }} />
                </Box>
              ) : (
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={handleTriggerBackup}
                  startIcon={<RefreshCcw size={16} />}
                  sx={{ borderRadius: 2 }}
                >
                  Trigger Manual Cloud Backup
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 2 }}>
            Cloud Database Snapshots
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Archive ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Compiled Size</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date Created</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Rollback</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backups.map((bak) => (
                  <TableRow key={bak.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{bak.id}</TableCell>
                    <TableCell>{bak.size}</TableCell>
                    <TableCell>
                      <Chip label={bak.status} size="small" color="success" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>{bak.date}</TableCell>
                    <TableCell align="center">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="secondary"
                        onClick={() => handleRestoreBackup(bak.id)}
                        sx={{ fontSize: '0.75rem', py: 0.2 }}
                      >
                        Restore Snapshot
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {backups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No backups available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;
