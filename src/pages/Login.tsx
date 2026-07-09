import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Card, CardContent, TextField, Button, Typography, Checkbox, 
  FormControlLabel, Grid, useTheme, Divider, Modal, Paper, Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, PhoneCall, ShieldAlert, KeyRound } from 'lucide-react';
import { RootState, loginRequest, verify2FA, addAuditLog } from '../store';
import { Role } from '../store';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { mode } = useSelector((state: RootState) => state.ui);
  const { is2FARequired, user } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    // Default mock login role is Admin
    dispatch(loginRequest({
      email,
      name: email.split('@')[0].toUpperCase(),
      role: 'Admin',
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

  const handleQuickLogin = (role: Role) => {
    const roleEmail = `${role.toLowerCase().replace(/\s/g, '')}@delivo.com`;
    const roleName = `${role} Demo`;
    
    dispatch(loginRequest({
      email: roleEmail,
      name: roleName,
      role,
      rememberMe: true
    }));

    dispatch(addAuditLog({
      username: roleEmail,
      role,
      action: `Quick Login Selected`,
      module: 'Auth',
      ipAddress: '127.0.0.1',
      browser: 'Chrome 126.0 (Windows)'
    }));

    // If role doesn't require 2FA, navigate immediately
    if (!['Super Admin', 'Admin', 'Finance Manager'].includes(role)) {
      navigate('/dashboard');
    }
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      dispatch(verify2FA(otpCode));
      
      dispatch(addAuditLog({
        username: user?.email || 'unknown',
        role: user?.role || 'Guest',
        action: '2FA Verification Successful',
        module: 'Auth',
        ipAddress: '127.0.0.1',
        browser: 'Chrome 126.0 (Windows)'
      }));

      navigate('/dashboard');
    }
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
            {!is2FARequired ? (
              // STEP 1: Email Password Form / Quick login
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
                      onChange={(e) => setEmail(e.target.value)}
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
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      InputProps={{
                        startAdornment: <Lock size={18} style={{ marginRight: 10, color: theme.palette.text.secondary }} />
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <FormControlLabel
                        control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} color="primary" />}
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

                    <Button 
                      type="submit" 
                      variant="contained" 
                      size="large"
                      fullWidth
                      sx={{ py: 1.5, borderRadius: 3, boxShadow: '0 4px 15px rgba(4, 120, 87, 0.2)' }}
                    >
                      Authenticate Securely
                    </Button>
                  </Box>
                </form>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    DEMO SIMULATOR QUICK LOGIN
                  </Typography>
                </Divider>

                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textAlign: 'center', mb: 1.5 }}>
                  Select a role to bypass database setup and view instant dashboard access configurations:
                </Typography>

                <Grid container spacing={1}>
                  {[
                    { role: 'Super Admin', color: 'primary' },
                    { role: 'Kitchen Manager', color: 'success' },
                    { role: 'Delivery Manager', color: 'info' },
                    { role: 'Finance Manager', color: 'secondary' }
                  ].map((btn) => (
                    <Grid item xs={6} key={btn.role}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickLogin(btn.role as Role)}
                        sx={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          borderRadius: 2, 
                          py: 1, 
                          color: `${btn.color}.main`, 
                          borderColor: `${btn.color}.main`,
                          bgcolor: `${btn.color}.main` + '05',
                          '&:hover': {
                            bgcolor: `${btn.color}.main` + '10',
                            borderColor: `${btn.color}.main`,
                          }
                        }}
                      >
                        {btn.role}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            ) : (
              // STEP 2: 2-Factor OTP input
              <motion.div
                key="2fa-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 3, 
                    bgcolor: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(13, 148, 136, 0.4)',
                    mb: 1.5
                  }}>
                    <PhoneCall size={26} color="white" />
                  </Box>
                  <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
                    Two-Factor Auth
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, textAlign: 'center' }}>
                    Enter the code sent to your registered device to log in as <strong>{user?.name}</strong>.
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>Simulator Token:</strong> Enter any 6-digit code (e.g. <code>123456</code>) to verify.
                  </Typography>
                </Alert>

                <form onSubmit={handle2FASubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                    <TextField
                      label="6-Digit Verification Code"
                      variant="outlined"
                      fullWidth
                      type="text"
                      inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '10px', fontSize: '1.2rem', fontWeight: 800 } }}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />

                    <Button 
                      type="submit" 
                      variant="contained" 
                      size="large"
                      fullWidth
                      disabled={otpCode.length !== 6}
                      sx={{ py: 1.5, borderRadius: 3, bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
                    >
                      Verify Token & Access
                    </Button>
                  </Box>
                </form>
              </motion.div>
            )}
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
            Enter your email address and we will simulate sending a secure password reset link to your inbox.
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
                  onChange={(e) => setForgotEmail(e.target.value)}
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
