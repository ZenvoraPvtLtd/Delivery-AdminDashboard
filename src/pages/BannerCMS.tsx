import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button, 
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, FormControl, InputLabel, Select, MenuItem, 
  Accordion, AccordionSummary, AccordionDetails, useTheme, Divider,
  CircularProgress
} from '@mui/material';
import { 
  Plus, Trash2, FileSignature, 
  ChevronDown, HelpCircle, Save, Check 
} from 'lucide-react';
import { RootState, addAuditLog, addNotification } from '../store';
import { cmsService, BannerResponse, BannerCreateRequest } from '../services/cmsService';

const BannerCMS: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [activeSubTab, setActiveSubTab] = useState<'banners' | 'cms'>('banners');
  const [bannerOpen, setBannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [faqs, setFaqs] = useState<{q: string, a: string}[]>([]);

  // Form states
  const [bTitle, setBTitle] = useState('');
  const [bImage, setBImage] = useState('');
  const [bType, setBType] = useState('Homepage');
  const [bSchedule, setBSchedule] = useState('');

  // CMS texts states
  const [cmsAbout, setCmsAbout] = useState('');
  const [cmsPrivacy, setCmsPrivacy] = useState('');
  const [saveAlert, setSaveAlert] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [banRes, pagesRes] = await Promise.all([
        cmsService.getBanners(),
        cmsService.getPages()
      ]);
      setBanners(banRes);
      setCmsAbout(pagesRes.aboutUs);
      setCmsPrivacy(pagesRes.privacyPolicy);
      setFaqs(pagesRes.faqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle || !bImage) return;

    try {
      const payload: BannerCreateRequest = {
        title: bTitle,
        image: bImage,
        status: 'Active',
        type: bType,
        schedule: bSchedule || 'Always active'
      };

      await cmsService.createBanner(payload);

      dispatch(addNotification({
        title: 'Marketing Banner Uploaded',
        description: `Banner "${bTitle}" added to slider registry.`,
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: `Created new banner: ${bTitle}`,
        module: 'Banner Management',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));

      setBannerOpen(false);
      setBTitle('');
      setBImage('');
      setBSchedule('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    if (confirm(`Delete banner "${title}" from sliders?`)) {
      try {
        await cmsService.deleteBanner(id);

        dispatch(addNotification({
          title: 'Banner Removed',
          description: `Successfully deleted "${title}" from registry.`,
          type: 'system'
        }));

        dispatch(addAuditLog({
          username: currentUser?.email || 'Simulator Client',
          role: currentUser?.role || 'Guest',
          action: `Deleted marketing banner ${title}`,
          module: 'Banner Management',
          ipAddress: '127.0.0.1',
          browser: 'Admin Console'
        }));
        
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleBannerStatus = async (id: string, title: string, currentStatus: string) => {
    try {
      await cmsService.toggleBannerStatus(id);
      const nextStatus = currentStatus === 'Active' ? 'Paused' : 'Active';

      dispatch(addNotification({
        title: 'Banner Status Updated',
        description: `Banner "${title}" set to ${nextStatus}.`,
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: `Toggled banner "${title}" status to ${nextStatus}`,
        module: 'Banner Management',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));
      
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCmsSave = async () => {
    try {
      await cmsService.updatePages({ aboutUs: cmsAbout, privacyPolicy: cmsPrivacy });
      setSaveAlert(true);
      setTimeout(() => setSaveAlert(false), 3000);
      
      dispatch(addNotification({
        title: 'CMS Guidelines Saved',
        description: 'Terms and Privacy policies successfully saved.',
        type: 'system'
      }));

      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: 'Saved CMS Policy settings',
        module: 'CMS',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Promotion Banners & CMS Settings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Update client app banner slideshows, change corporate terms pages, and organize customer FAQs
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant={activeSubTab === 'banners' ? 'contained' : 'outlined'} 
            onClick={() => setActiveSubTab('banners')}
            sx={{ borderRadius: 2 }}
          >
            Manage Slideshows
          </Button>
          <Button 
            variant={activeSubTab === 'cms' ? 'contained' : 'outlined'} 
            onClick={() => setActiveSubTab('cms')}
            sx={{ borderRadius: 2 }}
          >
            Policy & FAQ Editor
          </Button>
        </Box>
      </Box>

      {saveAlert && (
        <Box sx={{ mb: 3 }}>
          <Chip label="Policy maps compiled and pushed to CDN successfully." color="success" icon={<Check size={14} />} sx={{ borderRadius: 2 }} />
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : activeSubTab === 'banners' ? (
        // Banners layout list
        <Box>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setBannerOpen(true)}
              startIcon={<Plus size={16} />}
              sx={{ borderRadius: 2 }}
            >
              Add Promo Slide
            </Button>
          </Box>
          <Grid container spacing={3.5}>
            {banners.map((ban) => (
              <Grid item xs={12} md={4} key={ban.id}>
                <Card sx={{ height: '100%' }}>
                  <Box 
                    component="img" 
                    src={ban.image} 
                    sx={{ height: 160, width: '100%', objectFit: 'cover' }} 
                  />
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                        {ban.title}
                      </Typography>
                      <Chip label={ban.type} size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                      Schedule: <strong>{ban.schedule}</strong>
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip 
                        label={ban.status} 
                        size="small" 
                        color={ban.status === 'Active' ? 'success' : 'default'} 
                        sx={{ fontWeight: 700, cursor: 'pointer' }}
                        onClick={() => handleToggleBannerStatus(ban.id, ban.title, ban.status)}
                        title={`Click to ${ban.status === 'Active' ? 'Pause' : 'Activate'}`}
                      />
                      <IconButton size="small" color="error" onClick={() => handleDeleteBanner(ban.id, ban.title)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {banners.length === 0 && (
               <Typography variant="body2" sx={{ width: '100%', textAlign: 'center', py: 4, color: 'text.secondary' }}>No banners found.</Typography>
            )}
          </Grid>
        </Box>
      ) : (
        // Policy / FAQs layout CMS
        <Grid container spacing={3.5}>
          <Grid item xs={12} lg={7}>
            <Card>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <FileSignature size={20} color={theme.palette.secondary.main} />
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                    Legal & Policy Markdown Editor
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="About Us Bio details"
                  value={cmsAbout}
                  onChange={(e) => setCmsAbout(e.target.value)}
                />
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Privacy Policy Guidelines"
                  value={cmsPrivacy}
                  onChange={(e) => setCmsPrivacy(e.target.value)}
                />

                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleCmsSave}
                  startIcon={<Save size={16} />}
                  sx={{ width: 'fit-content', borderRadius: 2 }}
                >
                  Save Policy maps
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* FAQs Accordion */}
          <Grid item xs={12} lg={5}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <HelpCircle size={20} color={theme.palette.primary.main} />
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                    Restaurant FAQs Register
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {faqs.map((faq, idx) => (
                    <Accordion key={idx} sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ChevronDown size={16} />}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{faq.q}</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{faq.a}</Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                  {faqs.length === 0 && (
                     <Typography variant="body2" sx={{ color: 'text.secondary' }}>No FAQs configured yet.</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Add Banner Dialog */}
      <Dialog open={bannerOpen} onClose={() => setBannerOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 400 } }}>
        <form onSubmit={handleBannerSubmit}>
          <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>Register Promo Slide</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              label="Banner Title"
              value={bTitle}
              onChange={(e) => setBTitle(e.target.value)}
              placeholder="e.g. Christmas Special Combo"
              required
            />
            <TextField
              fullWidth
              size="small"
              label="Banner Image URL"
              value={bImage}
              onChange={(e) => setBImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              required
            />
            <FormControl fullWidth size="small">
              <InputLabel>Banner Type</InputLabel>
              <Select
                value={bType}
                label="Banner Type"
                onChange={(e) => setBType(e.target.value)}
              >
                <MenuItem value="Homepage">Homepage Slider</MenuItem>
                <MenuItem value="Offer">Offer Page Slider</MenuItem>
                <MenuItem value="Popup">Popup Alert Offer</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Running Schedule Details"
              value={bSchedule}
              onChange={(e) => setBSchedule(e.target.value)}
              placeholder="e.g. Valid July 24 - 26 only"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setBannerOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Add Banner</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default BannerCMS;
