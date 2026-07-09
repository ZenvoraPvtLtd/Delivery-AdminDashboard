import { createTheme, ThemeOptions } from '@mui/material/styles';

// Professional Deep Sage & Charcoal theme — light only
// Inspired by premium SaaS dashboards (Linear, Stripe, Notion)
const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1B4332', // Deep Forest Green — sophisticated, premium
      light: '#2D6A4F',
      dark: '#081C15',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8B5E3C', // Rich Walnut Brown — warm accent
      light: '#A67C5B',
      dark: '#6B4226',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2D6A4F', // Forest success
      light: '#40916C',
      dark: '#1B4332',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#C77B30', // Warm Autumn Gold
      light: '#DDA15E',
      dark: '#A05E1B',
    },
    error: {
      main: '#9B2C2C', // Deep Burgundy — muted, professional
      light: '#C53030',
      dark: '#742A2A',
    },
    info: {
      main: '#2C7A7B', // Deep Teal
      light: '#38B2AC',
      dark: '#234E52',
    },
    background: {
      default: '#F7F5F2', // Warm ivory-cream
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6B6B6B',
    },
    divider: '#E8E4DF',
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.04em',
      color: '#1A1A1A',
    },
    h2: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h3: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.6,
      letterSpacing: '-0.005em',
    },
    body2: {
      lineHeight: 1.5,
      letterSpacing: '-0.005em',
    },
    button: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 18px',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: 'none',
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
          border: '1px solid #1B4332',
          '&:hover': {
            background: 'linear-gradient(135deg, #081C15 0%, #1B4332 100%)',
            boxShadow: '0 4px 16px rgba(27, 67, 50, 0.3)',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(27, 67, 50, 0.4)',
          color: '#1B4332',
          '&:hover': {
            borderColor: '#1B4332',
            backgroundColor: 'rgba(27, 67, 50, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 14,
          border: '1px solid #E8E4DF',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            borderColor: '#D5CFC8',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
          }
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRight: '1px solid #E8E4DF',
          background: '#FDFCFA', // Slightly warm off-white sidebar
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(247, 245, 242, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E8E4DF',
          color: '#1A1A1A',
          boxShadow: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F0ECE7',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          color: '#6B6B6B',
          backgroundColor: '#FAF8F5',
          borderBottom: '1px solid #E8E4DF',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          transition: 'all 0.15s ease-in-out',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#B8B0A5',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1.5px',
            borderColor: '#1B4332',
          },
        },
        input: {
          padding: '11px 14px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
};

export const getTheme = (mode: 'light' | 'dark') => createTheme(themeOptions);
