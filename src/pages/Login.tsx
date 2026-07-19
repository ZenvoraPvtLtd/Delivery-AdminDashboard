import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Card, CardContent, TextField, Button, Typography, Checkbox, 
  FormControlLabel, Grid, useTheme, Divider, Modal, Paper, Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, PhoneCall, ShieldAlert, KeyRound, Loader2 } from 'lucide-react';
import { RootState, loginThunk, verify2FA, addAuditLog } from '../store';
import { Role } from '../store';

const Login: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { mode } = useSelector((state: RootState) => state.ui);
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    dispatch(loginThunk({
      email,
      password,
      rememberMe
    }));

    dispatch(addAuditLog({
      username: email,
      role: 'Admin',
      action: 'Attempt Login',
      module: 'Auth',
      ipAddress: '127.0.0.1',
      browser: 'Chrome 126.0 (Windows)'
    }));
  };



  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotEmail) {
      setForgotSent(true);
      setTimeout(() => {
        setForgotOpen(false);
        setForgotSent(false);
        setForgotEmail('');
      }, 3000);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: mode === 'dark'
          ? 'radial-gradient(circle at 10% 20%, rgba(14, 19, 38, 1) 0%, rgba(7, 10, 19, 1) 90.1%)'
          : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
        p: 2
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 460, borderRadius: 5, overflow: 'visible', position: 'relative' }}>
        {/* Glow effect for dark mode */}
        {mode === 'dark' && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: -10,
              left: -10,
              right: -10,
              bottom: -10,
              background: 'linear-gradient(135deg, #047857 0%, #0D9488 100%)',
              filter: 'blur(30px)',
              zIndex: -1,
              opacity: 0.15,
              borderRadius: 6
            }}
          />
        )}
        <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
          <AnimatePresence mode="wait">
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Brand Logo */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                  <Box sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 3, 
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(4, 120, 87, 0.4)',
                    mb: 1.5
                  }}>
                    <ShieldCheck size={28} color="white" />
                  </Box>
                  <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800, letterSpacing: '-0.5px' }}>
                    Delivo<span style={{ color: theme.palette.primary.main }}>Admin</span>
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, textAlign: 'center' }}>
                    Enterprise Delivery Management Console
                  </Typography>
                </Box>

                <form onSubmit={handleLoginSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                      label="Admin Email Address"
                      variant="outlined"
                      fullWidth
                      type="email"
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                      placeholder="admin@delivo.com"
                      InputProps={{
                        startAdornment: <Mail size={18} style={{ marginRight: 10, color: theme.palette.text.secondary }} />
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                    <TextField
                      label="Security Password"
                      variant="outlined"
                      fullWidth
                      type="password"
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      InputProps={{
                        startAdornment: <Lock size={18} style={{ marginRight: 10, color: theme.palette.text.secondary }} />
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <FormControlLabel
                        control={<Checkbox checked={rememberMe} onChange={(e: any) => setRememberMe(e.target.checked)} color="primary" />}
                        label={<Typography variant="body2">Remember Me</Typography>}
                      />
                      <Button 
                        onClick={() => setForgotOpen(true)} 
                        sx={{ fontSize: '0.8rem', textTransform: 'none', fontWeight: 600 }}
                        color="secondary"
                      >
                        Forgot Password?
                      </Button>
                    </Box>

                    {error && (
                      <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                      </Alert>
                    )}

                    <Button 
                      type="submit" 
                      variant="contained" 
                      size="large"
                      fullWidth
                      disabled={isLoading}
                      sx={{ py: 1.5, borderRadius: 3, boxShadow: '0 4px 15px rgba(4, 120, 87, 0.2)' }}
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : 'Authenticate Securely'}
                    </Button>
                  </Box>
                </form>

              </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper sx={{ width: '100%', maxWidth: 400, p: 3, borderRadius: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <KeyRound size={20} color={theme.palette.secondary.main} />
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Reset Password</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Enter your email address and we will send a secure password reset link to your inbox.
          </Typography>
          {forgotSent ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Reset link sent! Redirecting back...
            </Alert>
          ) : (
            <form onSubmit={handleForgotSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Email Address"
                  variant="outlined"
                  fullWidth
                  required
                  type="email"
                  value={forgotEmail}
                  onChange={(e: any) => setForgotEmail(e.target.value)}
                  placeholder="admin@delivo.com"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
                <Button type="submit" variant="contained" fullWidth sx={{ py: 1.2, borderRadius: 3 }}>
                  Send Recovery Link
                </Button>
              </Box>
            </form>
          )}
        </Paper>
      </Modal>
    </Box>
  );
};

export default Login;
