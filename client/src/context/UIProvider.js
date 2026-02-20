import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Typography, Box, Slide, Fade } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/UI/ConfirmDialog';
// --- Toast Component ---

const colors = {
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

const ToastCard = styled(motion.div, {
  shouldForwardProp: (prop) => prop !== '$severity',
})(({ theme, $severity }) => {
  const color = colors[$severity] || colors.info;

  return {
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.background.paper, 0.95)
      : alpha('#fff', 0.95),
    backdropFilter: 'blur(20px)',
    borderLeft: `4px solid ${color}`,
    borderRadius: '12px',
    padding: theme.spacing(1.5, 2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    boxShadow: `0 8px 30px -4px ${alpha(color, 0.15)}`,
    color: theme.palette.text.primary,
    minWidth: '300px',
    maxWidth: '400px',
  };
});

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  // Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  // Confirm State
  const [confirm, setConfirm] = useState({ 
    open: false, 
    title: '', 
    message: '', 
    onConfirm: () => {}, 
    onCancel: () => {},
    options: {} 
  });

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const confirmAction = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirm({
        open: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure?',
        options: options,
        onConfirm: () => {
          setConfirm((prev) => ({ ...prev, open: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirm((prev) => ({ ...prev, open: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const Icon = icons[toast.severity] || Info;
  const severityColor = colors[toast.severity] || colors.info;

  return (
    <UIContext.Provider value={{ showToast, confirmAction }}>
      {children}
      
      {/* Toast Render */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={hideToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Slide}
      >
        <ToastCard
          $severity={toast.severity}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          layout
        >
          <Box sx={{ 
            p: 0.8, 
            borderRadius: '8px', 
            background: alpha(severityColor, 0.1),
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <Icon size={20} color={severityColor} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {toast.severity.charAt(0).toUpperCase() + toast.severity.slice(1)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
              {toast.message}
            </Typography>
          </Box>
          <Box 
            onClick={hideToast}
            sx={{ 
              cursor: 'pointer', 
              opacity: 0.4, 
              '&:hover': { opacity: 1 },
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <XCircle size={16} />
          </Box>
        </ToastCard>
      </Snackbar>

      {/* Confirm Dialog Render */}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={confirm.onCancel}
        {...confirm.options}
      />
    </UIContext.Provider>
  );
};
