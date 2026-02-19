import axios from "axios";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Container,
  Divider,
} from "@mui/material";
import { 
  MessageSquare, 
  Sun, 
  Moon, 
  LogOut, 
  Menu as MenuIcon,
  User,
  LayoutDashboard,
  Users,
  Settings
} from "lucide-react";
import { styled, alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useUI } from "../context/UIProvider";

const GlassAppBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.default, 0.5) 
    : alpha(theme.palette.background.default, 0.5),
  backdropFilter: "blur(20px)",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  color: theme.palette.text.primary,
  boxShadow: "none",
  transition: 'background 0.3s ease',
}));

const NavLink = styled(motion.div)(({ theme, $active }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: '12px',
  cursor: 'pointer',
  color: $active ? theme.palette.primary.main : theme.palette.text.secondary,
  fontWeight: 600,
  fontSize: '0.9rem',
  gap: '8px',
  transition: 'all 0.2s ease',
  '&:hover': {
    color: theme.palette.primary.main,
    background: alpha(theme.palette.primary.main, 0.05),
  },
  ...($active && {
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -15,
      left: '20%',
      width: '60%',
      height: '3px',
      background: theme.palette.primary.main,
      borderRadius: '2px 2px 0 0',
      boxShadow: `0 -2px 10px ${theme.palette.primary.main}`,
    }
  })
}));

function Navbar({ token, setToken, toggleTheme, mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmAction } = useUI();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  
  const userId = token ? jwtDecode(token).userId : null;
  const API = process.env.REACT_APP_API || "http://localhost:5000";

  useEffect(() => {
    const fetchUser = async () => {
      if (token && userId) {
        try {
          const { data } = await axios.get(`${API}/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(data);
        } catch (err) {
          console.error("Failed to fetch user in Navbar", err);
          if (err.response?.status === 404) {
            localStorage.removeItem("token");
            setToken(null);
            navigate("/login");
          }
        }
      } else {
        setUser(null);
      }
    };
    fetchUser();
  }, [token, userId, API, navigate, setToken]);

  const displayUsername = user?.username || "User";
  const displayProfile = user?.profile ? `${API}/${user.profile}` : "";

  const handleLogout = async () => {
    const isConfirmed = await confirmAction({
      title: "Disconnect from Orbit?",
      message: "You are about to close this communication channel. Any unsaved data in drafts will be lost.",
      confirmText: "Sign Out",
      cancelText: "Stay Connected",
      severity: "warning"
    });

    if (isConfirmed) {
      localStorage.removeItem("token");
      setToken(null);
      navigate("/login");
    }
  };

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Groups', path: '/groups', icon: Users },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <GlassAppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ height: 72, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <motion.div whileHover={{ rotate: 10 }}>
              <Box sx={{ 
                background: `linear-gradient(135deg, #6366f1 0%, #ec4899 100%)`,
                p: 1.2,
                borderRadius: '12px',
                display: 'flex',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
              }}>
                <MessageSquare color="white" size={22} />
              </Box>
            </motion.div>
            <Typography
              variant="h5"
              component={RouterLink}
              to="/"
              sx={{
                fontWeight: 900,
                textDecoration: 'none',
                color: 'inherit',
                letterSpacing: '-1px',
                display: { xs: 'none', sm: 'block' },
                background: 'linear-gradient(to right, #6366f1, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Orbit
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {token ? menuItems.map((item) => (
              <NavLink 
                key={item.path}
                $active={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                whileHover={{ y: -2 }}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            )) : (
              <>
                <Button component={RouterLink} to="/login" sx={{ borderRadius: '12px', fontWeight: 600 }}>Login</Button>
                <Button component={RouterLink} to="/register" variant="contained" sx={{ borderRadius: '12px', fontWeight: 600, px: 3 }}>Join Orbit</Button>
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={toggleTheme} sx={{ p: 1.2, border: '1px solid', borderColor: 'divider' }}>
              {mode === 'dark' ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#6366f1" />}
            </IconButton>
            
            {token && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1 }}>{displayUsername}</Typography>
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>Pro Member</Typography>
                </Box>
                <IconButton onClick={(e) => setMenuOpen(e.currentTarget)} sx={{ p: 0.5, border: '2px solid', borderColor: 'primary.main' }}>
                  <Avatar src={displayProfile} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                    {displayUsername[0]?.toUpperCase()}
                  </Avatar>
                </IconButton>
              </Box>
            )}
            
            <IconButton 
              sx={{ display: { xs: 'flex', md: 'none' } }}
              onClick={(e) => setMenuOpen(e.currentTarget)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      <Menu
        anchorEl={menuOpen}
        open={Boolean(menuOpen)}
        onClose={() => setMenuOpen(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 2,
            minWidth: 200,
            borderRadius: '20px',
            p: 1,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        {token && (
          <Box sx={{ p: 2, mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={800}>{displayUsername}</Typography>
            <Typography variant="caption" color="text.secondary">Account Management</Typography>
          </Box>
        )}
        <MenuItem onClick={() => { navigate("/profile"); setMenuOpen(null); }} sx={{ borderRadius: '12px', gap: 1.5, py: 1 }}>
          <Settings size={18} /> Settings
        </MenuItem>
        <Divider sx={{ my: 1, opacity: 0.5 }} />
        <MenuItem onClick={handleLogout} sx={{ borderRadius: '12px', gap: 1.5, py: 1, color: 'error.main' }}>
          <LogOut size={18} /> Sign Out
        </MenuItem>
      </Menu>
    </GlassAppBar>
  );
}

export default Navbar;
