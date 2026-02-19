import React from "react";
import { Link } from "react-router-dom";
import { Box, Container, Typography, IconButton, Grid, Divider } from "@mui/material";
import { Github, Twitter, Instagram, Mail, Heart } from "lucide-react";
import { styled, alpha } from "@mui/material/styles";

const GlassFooter = styled('footer')(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(12px)",
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(6, 0, 3, 0),
  marginTop: 'auto',
}));

const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  transition: 'color 0.2s',
  '&:hover': {
    color: theme.palette.primary.main,
  }
}));

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <GlassFooter>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" fontWeight={800} color="primary">ChatApp</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 300 }}>
              A modern, high-performance chat application built for seamless communication across the globe.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[Github, Twitter, Instagram, Mail].map((Icon, i) => (
                <IconButton key={i} size="small" sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', '&:hover': { bgcolor: '#6366f1', color: 'white' } }}>
                  <Icon size={18} />
                </IconButton>
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Platform</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FooterLink to="/">Dashboard</FooterLink>
              <FooterLink to="/groups">Groups</FooterLink>
              <FooterLink to="/profile">Profile</FooterLink>
            </Box>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Support</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FooterLink to="#">Help Center</FooterLink>
              <FooterLink to="#">Terms</FooterLink>
              <FooterLink to="#">Privacy</FooterLink>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, opacity: 0.5 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} ChatApp. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            Crafted with <Heart size={14} color="#ef4444" fill="#ef4444" /> by sarthak03dot
          </Typography>
        </Box>
      </Container>
    </GlassFooter>
  );
};

export default Footer;
