import React from 'react';
import { Snackbar, Alert, Typography, Box, Slide } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StyledSnackbar = styled(Snackbar)(({ theme }) => ({
  '& .MuiPaper-root': {
    background: 'transparent',
    boxShadow: 'none',
    padding: 0,
    minWidth: '300px',
  },
}));

const ToastCard = styled(motion.div)(({ theme, severity }) => {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };
  const color = colors[severity] || colors.info;

  return {
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.background.paper, 0.8)
      : alpha('#fff', 0.9),
    backdropFilter: 'blur(16px)',
    border: `1px solid ${alpha(color, 0.3)}`,
    borderRadius: '16px',
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    boxShadow: `0 8px 32px -4px ${alpha(color, 0.2)}`,
    color: theme.palette.text.primary,
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '4px',
      background: color,
    }
  };
});

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

function Toast({ open, message, severity = 'info', onClose }) {
  const Icon = icons[severity] || Info;
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  return (
    <StyledSnackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      TransitionComponent={Slide}
    >
      <ToastCard
        severity={severity}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
      >
        <Box sx={{ 
          p: 1, 
          borderRadius: '12px', 
          background: alpha(colors[severity], 0.1),
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <Icon size={20} color={colors[severity]} />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {message}
          </Typography>
        </Box>
      </ToastCard>
    </StyledSnackbar>
  );
}

export default Toast;
