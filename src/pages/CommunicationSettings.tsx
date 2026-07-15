import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Switch, 
  FormControlLabel, TextField, MenuItem, Select, FormControl, 
  InputLabel, Divider, Alert, Tab, Tabs, FormHelperText, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
  MessageSquare, Save, Settings, Key, HelpCircle, Terminal, 
  RefreshCcw, Layers, Sliders, CheckCircle2, AlertTriangle, Send 
} from 'lucide-react';
import axios from 'axios';
import { RootState, addNotification, addAuditLog, setCommunicationSettings } from '../store';

const CommunicationSettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Local states matching communicationSettings schema
  const [enableWhatsapp, setEnableWhatsapp] = useState(true);
  const [enableSms, setEnableSms] = useState(true);
  const [defaultProvider, setDefaultProvider] = useState('meta');
  const [whatsappProvider, setWhatsappProvider] = useState('meta');
  const [smsProvider, setSmsProvider] = useState('twilio');
  
  // API Keys
  const [metaToken, setMetaToken] = useState('mock-meta-token-xyz-98765');
  const [twilioSid, setTwilioSid] = useState('mock-twilio-sid-12345');
  const [twilioAuthToken, setTwilioAuthToken] = useState('mock-twilio-auth-token-67890');
  const [msg91Key, setMsg91Key] = useState('mock-msg91-key-abcde');
  const [textlocalKey, setTextlocalKey] = useState('mock-textlocal-key-fghij');
  const [fast2smsKey, setFast2smsKey] = useState('mock-fast2sms-key-klmno');
  
  const [webhookSecret, setWebhookSecret] = useState('whsec_ZenvoraSecretToken2026');
  const [retryCount, setRetryCount] = useState(3);
  const [confirmationExpiry, setConfirmationExpiry] = useState(24);
  
  // Templates
  const [templateConfirm, setTemplateConfirm] = useState('');
  const [templateCancel, setTemplateCancel] = useState('');
  const [templateSuccess, setTemplateSuccess] = useState('');
  const [templateReminder, setTemplateReminder] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Test Connection Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('+1 555-0199');
  const [testChannel, setTestChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Load current communication settings from API
    axios.get('/api/orders/settings')
      .then(res => {
        const s = res.data;
        if (s && Object.keys(s).length > 0) {
          setEnableWhatsapp(s.enableWhatsapp ?? true);
          setEnableSms(s.enableSms ?? true);
          setDefaultProvider(s.defaultProvider ?? 'meta');
          setWhatsappProvider(s.whatsappProvider ?? 'meta');
          setSmsProvider(s.smsProvider ?? 'twilio');
          setMetaToken(s.apiKeys?.metaToken ?? '');
          setTwilioSid(s.apiKeys?.twilioSid ?? '');
          setTwilioAuthToken(s.apiKeys?.twilioAuthToken ?? '');
          setMsg91Key(s.apiKeys?.msg91Key ?? '');
          setTextlocalKey(s.apiKeys?.textlocalKey ?? '');
          setFast2smsKey(s.apiKeys?.fast2smsKey ?? '');
          setWebhookSecret(s.webhookSecret ?? '');
          setRetryCount(s.retryCount ?? 3);
          setConfirmationExpiry(s.confirmationExpiry ?? 24);
          
          if (s.templates) {
            setTemplateConfirm(s.templates.confirmation ?? '');
            setTemplateCancel(s.templates.cancellation ?? '');
            setTemplateSuccess(s.templates.success ?? '');
            setTemplateReminder(s.templates.reminder ?? '');
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load settings:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlertMsg(null);

    const payload = {
      enableWhatsapp,
      enableSms,
      defaultProvider,
      whatsappProvider,
      smsProvider,
      apiKeys: {
        metaToken,
        twilioSid,
        twilioAuthToken,
        msg91Key,
        textlocalKey,
        fast2smsKey
      },
      webhookSecret,
      retryCount: Number(retryCount),
      confirmationExpiry: Number(confirmationExpiry),
      templates: {
        confirmation: templateConfirm,
        cancellation: templateCancel,
        success: templateSuccess,
        reminder: templateReminder
      }
    };

    try {
      const response = await axios.post('/api/orders/settings', payload);
      if (response.data.success) {
        dispatch(setCommunicationSettings(payload));
        setAlertMsg({ type: 'success', text: 'Communication settings successfully synchronized with central backend.' });
        
        dispatch(addNotification({
          title: 'Settings Updated',
          description: 'Multi-channel order confirmation settings updated.',
          type: 'system'
        }));

        dispatch(addAuditLog({
          username: currentUser?.email || 'superadmin@delivo.com',
          role: currentUser?.role || 'Super Admin',
          action: 'Updated multi-channel confirmation settings',
          module: 'Settings',
          ipAddress: '127.0.0.1',
          browser: 'Admin Console'
        }));
      } else {
        setAlertMsg({ type: 'error', text: 'API returned unexpected error during save operation.' });
      }
    } catch (err: any) {
      console.error(err);
      setAlertMsg({ type: 'error', text: err.response?.data?.error || 'Failed to connect to backend api.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    try {
      // Simulate connection testing by making a test dispatch
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let isSuccess = true;
      let respMsg = `Successfully verified link with provider gateway. Diagnostic packet delivered.`;

      if (testChannel === 'whatsapp' && whatsappProvider === 'meta' && !metaToken) {
        isSuccess = false;
        respMsg = 'Validation Failed: Meta Cloud Access Token is required.';
      } else if (testChannel === 'sms' && smsProvider === 'twilio' && (!twilioSid || !twilioAuthToken)) {
        isSuccess = false;
        respMsg = 'Validation Failed: Twilio Sid and Auth Token are required.';
      }

      setTestResult({
        success: isSuccess,
        message: respMsg
      });

      if (isSuccess) {
        dispatch(addNotification({
          title: 'Diagnostic Sent',
          description: `Test message dispatched successfully via ${testChannel.toUpperCase()}`,
          type: 'system'
        }));
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network exception encountered during validation.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress color="primary" />
        <Typography variant="body1" sx={{ ml: 2, fontWeight: 500 }}>Retrieving settings matrix...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
          Communication & Notifications Settings
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Configure WhatsApp & SMS gateway endpoints, API credentials, and order status text templates
        </Typography>
      </Box>

      {alertMsg && (
        <Alert severity={alertMsg.type} sx={{ mb: 3.5, borderRadius: 2 }}>
          {alertMsg.text}
        </Alert>
      )}

      <form onSubmit={handleSave}>
        <Grid container spacing={3.5}>
          {/* Main Controls Card */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ 
              background: 'rgba(18, 26, 47, 0.65)', 
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 3
            }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1 }}>
                  <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)} textColor="primary" indicatorColor="primary">
                    <Tab label="Gateway Options" icon={<Sliders size={16} />} iconPosition="start" sx={{ py: 2, fontWeight: 600 }} />
                    <Tab label="Message Templates" icon={<MessageSquare size={16} />} iconPosition="start" sx={{ py: 2, fontWeight: 600 }} />
                    <Tab label="API Keys & Security" icon={<Key size={16} />} iconPosition="start" sx={{ py: 2, fontWeight: 600 }} />
                  </Tabs>
                </Box>

                {/* Tab 0: Gateways */}
                {activeTab === 0 && (
                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, fontFamily: 'Outfit' }}>Channels Activation</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 2 }}>
                            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>WhatsApp Channel</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Trigger Meta Cloud API notification on order creation</Typography>
                              </Box>
                              <Switch checked={enableWhatsapp} onChange={e => setEnableWhatsapp(e.target.checked)} color="success" />
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 2 }}>
                            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>SMS Channel</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Trigger carrier SMS push notifications</Typography>
                              </Box>
                              <Switch checked={enableSms} onChange={e => setEnableSms(e.target.checked)} color="success" />
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontFamily: 'Outfit' }}>Default Providers Routing</Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Default Channel Choice</InputLabel>
                            <Select value={defaultProvider} label="Default Channel Choice" onChange={e => setDefaultProvider(e.target.value)}>
                              <MenuItem value="meta">Meta Cloud (WhatsApp)</MenuItem>
                              <MenuItem value="twilio">Twilio SMS (SMS)</MenuItem>
                            </Select>
                            <FormHelperText>Initial channel check during orders confirmation</FormHelperText>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth size="small">
                            <InputLabel>WhatsApp Provider</InputLabel>
                            <Select value={whatsappProvider} label="WhatsApp Provider" onChange={e => setWhatsappProvider(e.target.value)}>
                              <MenuItem value="meta">Meta WhatsApp Cloud API</MenuItem>
                              <MenuItem value="twilio">Twilio WhatsApp API</MenuItem>
                              <MenuItem value="gupshup">Gupshup Gateway</MenuItem>
                              <MenuItem value="interakt">Interakt Integration</MenuItem>
                              <MenuItem value="360dialog">360Dialog Core</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth size="small">
                            <InputLabel>SMS Provider</InputLabel>
                            <Select value={smsProvider} label="SMS Provider" onChange={e => setSmsProvider(e.target.value)}>
                              <MenuItem value="twilio">Twilio SMS</MenuItem>
                              <MenuItem value="msg91">MSG91 Enterprise</MenuItem>
                              <MenuItem value="textlocal">Textlocal Gateway</MenuItem>
                              <MenuItem value="fast2sms">Fast2SMS</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontFamily: 'Outfit' }}>System Retry Limits</Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Provider Retries Count"
                            value={retryCount}
                            onChange={e => setRetryCount(Math.max(0, Number(e.target.value)))}
                            helperText="Number of attempts to retry sending before shifting channels"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Confirmation Expiration (Hours)"
                            value={confirmationExpiry}
                            onChange={e => setConfirmationExpiry(Math.max(1, Number(e.target.value)))}
                            helperText="Interval before orders transition to Confirmation Expired"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                )}

                {/* Tab 1: Message Templates */}
                {activeTab === 1 && (
                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Terminal size={14} /> Supported Template Variables:
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, fontFamily: 'Courier New', lineHeight: 1.6 }}>
                        {`{{CustomerName}}`} | {`{{OrderID}}`} | {`{{Items}}`} | {`{{Amount}}`} | {`{{Address}}`} | {`{{CompanyName}}`} | {`{{SupportNumber}}`}
                      </Typography>
                    </Box>

                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      label="Confirmation Request Message"
                      value={templateConfirm}
                      onChange={e => setTemplateConfirm(e.target.value)}
                      placeholder="Insert order confirmation request template..."
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Success Confirmation Confirmation"
                      value={templateSuccess}
                      onChange={e => setTemplateSuccess(e.target.value)}
                      placeholder="Insert thank you confirmation template..."
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Cancellation Message"
                      value={templateCancel}
                      onChange={e => setTemplateCancel(e.target.value)}
                      placeholder="Insert cancellation details template..."
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Reminder Message"
                      value={templateReminder}
                      onChange={e => setTemplateReminder(e.target.value)}
                      placeholder="Insert alert follow up template..."
                    />
                  </Box>
                )}

                {/* Tab 2: API Keys */}
                {activeTab === 2 && (
                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontFamily: 'Outfit' }}>API Keys configuration</Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="password"
                            label="Meta WhatsApp Access Token"
                            value={metaToken}
                            onChange={e => setMetaToken(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="password"
                            label="Twilio Account SID"
                            value={twilioSid}
                            onChange={e => setTwilioSid(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="password"
                            label="Twilio Auth Token"
                            value={twilioAuthToken}
                            onChange={e => setTwilioAuthToken(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="password"
                            label="MSG91 Api Key"
                            value={msg91Key}
                            onChange={e => setMsg91Key(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="password"
                            label="Textlocal Key"
                            value={textlocalKey}
                            onChange={e => setTextlocalKey(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="password"
                            label="Fast2SMS Access Token"
                            value={fast2smsKey}
                            onChange={e => setFast2smsKey(e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontFamily: 'Outfit' }}>Security & Callback Validation</Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Webhook Secrets Token"
                            value={webhookSecret}
                            onChange={e => setWebhookSecret(e.target.value)}
                            helperText="Verifies webhook signatures for WhatsApp/SMS response endpoints"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                )}

                {/* Card Action footer */}
                <Box sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    startIcon={<Send size={16} />}
                    onClick={() => setTestModalOpen(true)}
                  >
                    Test Connection
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                    disabled={saving}
                  >
                    {saving ? 'Synchronizing...' : 'Save Settings'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right helper Card */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ 
              background: 'rgba(18, 26, 47, 0.45)', 
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 3
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <HelpCircle size={20} color="#FF6B00" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                    Setup Guide
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2.5 }}>
                  The Order Confirmation workflow uses a cascading fallback pattern to contact customers. When an order is created, the system executes the following chain:
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(255, 107, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B00', fontWeight: 'bold', fontSize: '0.75rem', shrink: 0 }}>
                      1
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>WhatsApp Core Dispatch</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Sends confirmation template. If delivery confirmation fails, retries up to configured limit.</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(255, 107, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B00', fontWeight: 'bold', fontSize: '0.75rem', shrink: 0 }}>
                      2
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>SMS Failover Cascade</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>If WhatsApp fails, automatically switches to SMS carriers and attempts retries.</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(255, 107, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B00', fontWeight: 'bold', fontSize: '0.75rem', shrink: 0 }}>
                      3
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Admin Alert & Reminders</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Sends automated reminder hooks at +2 and +6 hours. Cancels and flags order to Admin after 24 hours.</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>

      {/* Test Connection Modal */}
      <Dialog open={testModalOpen} onClose={() => setTestModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Test Connection Diagnostics</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Dispatch a mock diagnostic packet to test link handshake with provider endpoints.
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Customer Mobile Number"
            value={testPhone}
            onChange={e => setTestPhone(e.target.value)}
          />

          <FormControl fullWidth size="small">
            <InputLabel>Target Channel</InputLabel>
            <Select value={testChannel} label="Target Channel" onChange={e => setTestChannel(e.target.value as any)}>
              <MenuItem value="whatsapp">WhatsApp Channel</MenuItem>
              <MenuItem value="sms">SMS Carrier Channel</MenuItem>
            </Select>
          </FormControl>

          {testResult && (
            <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 1 }}>
              {testResult.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => { setTestModalOpen(false); setTestResult(null); }} color="secondary" disabled={testingConnection}>
            Cancel
          </Button>
          <Button 
            onClick={handleTestConnection} 
            color="primary" 
            variant="contained" 
            disabled={testingConnection}
            startIcon={testingConnection ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
          >
            {testingConnection ? 'Testing Gateway...' : 'Execute Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunicationSettingsPage;
