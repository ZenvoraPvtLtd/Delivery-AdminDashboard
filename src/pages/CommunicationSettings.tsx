import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, Switch, 
  FormControlLabel, TextField, Alert, LinearProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme, Chip,
  Accordion, AccordionSummary, AccordionDetails, CircularProgress
} from '@mui/material';
import { 
  MessageSquare, Mail, Smartphone, Save, ChevronDown, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { RootState, addAuditLog, addNotification } from '../store';
import { settingsService, EmailTemplateResponse, SmsTemplateResponse, ProviderResponse } from '../services/settingsService';

const CommunicationSettings: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);

  // States
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateResponse[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplateResponse[]>([]);
  const [providers, setProviders] = useState<ProviderResponse[]>([]);
  
  const [saveAlert, setSaveAlert] = useState(false);
  
  // Local edit states for inputs
  const [emailEdits, setEmailEdits] = useState<Record<string, { subject: string, body: string }>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await settingsService.getCommunicationData();
      setEmailTemplates(data.emailTemplates);
      setSmsTemplates(data.smsTemplates);
      setProviders(data.providers);

      // Initialize edit states
      const ed: any = {};
      data.emailTemplates.forEach(t => {
        ed[t.type] = { subject: t.subject, body: t.body };
      });
      setEmailEdits(ed);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProviderToggle = async (name: string) => {
    try {
      const data = await settingsService.toggleProvider(name);
      setProviders(data.providers);

      dispatch(addNotification({
        title: 'Provider Updated',
        description: `Connectivity rules for ${name} were updated.`,
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: `Toggled communication provider: ${name}`,
        module: 'Communication Center',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmailSave = async (type: string) => {
    try {
      const ed = emailEdits[type];
      if (!ed) return;
      const data = await settingsService.updateEmailTemplate(type, ed.subject, ed.body);
      setEmailTemplates(data.emailTemplates);

      setSaveAlert(true);
      setTimeout(() => setSaveAlert(false), 3000);

      dispatch(addNotification({
        title: 'Template Saved',
        description: `${type} HTML email layout committed to memory.`,
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: `Edited HTML email layout for ${type}`,
        module: 'Communication Center',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmailEditChange = (type: string, field: 'subject'|'body', val: string) => {
    setEmailEdits(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: val }
    }));
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
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
          Communication Hub Templates
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Design email layouts, push notification strings, and configure SMS delivery brokers
        </Typography>
      </Box>

      {saveAlert && (
        <Alert severity="success" sx={{ mb: 3.5, borderRadius: 2 }}>
          Template format validated and deployed to caching servers successfully.
        </Alert>
      )}

      <Grid container spacing={3.5}>
        {/* Email Templates */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Mail size={22} color={theme.palette.primary.main} />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Email HTML Dispatches
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {emailTemplates.map((tpl, i) => (
                  <Accordion key={i} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ChevronDown size={16} />}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{tpl.type}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Email Subject Line"
                        value={emailEdits[tpl.type]?.subject || ''}
                        onChange={(e) => handleEmailEditChange(tpl.type, 'subject', e.target.value)}
                      />
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={4}
                        label="HTML Body Structure"
                        value={emailEdits[tpl.type]?.body || ''}
                        onChange={(e) => handleEmailEditChange(tpl.type, 'body', e.target.value)}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          size="small" 
                          startIcon={<Save size={16} />}
                          onClick={() => handleEmailSave(tpl.type)}
                        >
                          Commit Layout
                        </Button>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* SMS and Providers */}
        <Grid item xs={12} lg={5}>
          <Grid container spacing={3.5}>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <ShieldCheck size={22} color={theme.palette.success.main} />
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                      Active Broker Gateways
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {providers.map((p, i) => (
                      <FormControlLabel
                        key={i}
                        control={
                          <Switch 
                            checked={p.isActive} 
                            onChange={() => handleProviderToggle(p.name)}
                            color="success" 
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {p.name.includes('SMTP') ? <Mail size={16} /> : <MessageSquare size={16} />} 
                            <Typography variant="body2">{p.name}</Typography>
                          </Box>
                        }
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Smartphone size={22} color={theme.palette.info.main} />
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                      SMS Text Delivery Strings
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {smsTemplates.map((sms, i) => (
                      <Box key={i} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: 'text.secondary' }}>
                          {sms.type} Trigger
                        </Typography>
                        <Typography variant="body2">{sms.message}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

      </Grid>
    </Box>
  );
};

export default CommunicationSettings;
