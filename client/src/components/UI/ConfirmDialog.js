import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Slide,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { AlertTriangle, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.background.paper, 0.8) 
      : alpha('#fff', 0.9),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    padding: theme.spacing(1),
    minWidth: '320px',
  },
}));

function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", severity = "warning" }) {
  const isDanger = severity === 'error';

  return (
    <StyledDialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Box 
          sx={{ 
            width: 60, 
            height: 60, 
            borderRadius: '50%', 
            background: isDanger ? alpha('#ef4444', 0.1) : alpha('#f59e0b', 0.1),
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 20px',
          }}
        >
          <AlertTriangle size={32} color={isDanger ? '#ef4444' : '#f59e0b'} />
        </Box>
        
        <Typography variant="h6" fontWeight={800} gutterBottom>
          {title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
          {message}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={onCancel}
            sx={{ 
              borderRadius: '12px', 
              fontWeight: 700, 
              border: `1px solid ${alpha('#94a3b8', 0.3)}`,
              color: 'text.secondary'
            }}
          >
            {cancelText}
          </Button>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={onConfirm}
            sx={{ 
              borderRadius: '12px', 
              fontWeight: 700,
              bgcolor: isDanger ? 'error.main' : 'primary.main',
              '&:hover': {
                bgcolor: isDanger ? 'error.dark' : 'primary.dark',
              }
            }}
          >
            {confirmText}
          </Button>
        </Box>
      </Box>
    </StyledDialog>
  );
}

export default ConfirmDialog;
