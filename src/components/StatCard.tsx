import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral' | 'info';
  color?: string;
  isPulse?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendType = 'neutral',
  color = '#047857',
  isPulse = false
}) => {
  const theme = useTheme();

  const getTrendColor = () => {
    switch (trendType) {
      case 'up': return theme.palette.success.main;
      case 'down': return theme.palette.error.main;
      case 'info': return theme.palette.secondary.main;
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Card 
        sx={{ 
          position: 'relative', 
          overflow: 'hidden',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark' 
              ? `0 10px 30px rgba(0, 0, 0, 0.3), 0 0 15px ${color}1A`
              : '0 10px 20px rgba(0, 0, 0, 0.05)'
          }
        }}
      >
        {/* Glow corner */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: -20, 
            right: -20, 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            background: color, 
            opacity: theme.palette.mode === 'dark' ? 0.08 : 0.03,
            filter: 'blur(20px)'
          }} 
        />

        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {title}
            </Typography>
            <Box 
              sx={{ 
                p: 1, 
                borderRadius: 2, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {icon}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {value}
            </Typography>
            {isPulse && (
              <Box className="pulse-indicator" sx={{ bgcolor: color }} />
            )}
          </Box>

          {trend && (
            <Typography variant="caption" sx={{ color: getTrendColor(), fontWeight: 600 }}>
              {trend}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
