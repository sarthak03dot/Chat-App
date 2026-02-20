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
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
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
  Settings,
  X
} from "lucide-react";
import { styled, alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "../context/UIProvider";

const GlassAppBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.default, 0.7) 
    : alpha(theme.palette.background.default, 0.7),
  backdropFilter: "blur(20px)",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  color: theme.palette.text.primary,
  boxShadow: "none",
  transition: 'background 0.3s ease',
}));

const NavLink = styled(motion.div, {
  shouldForwardProp: (prop) => prop !== '$active',
})(({ theme, $active }) => ({
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
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
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
    setDrawerOpen(false);
    setUserMenuAnchor(null);
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

  const handleNav = (path) => {
    navigate(path);
    setDrawerOpen(false);
    setUserMenuAnchor(null);
  };

  return (
    <>
      <GlassAppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 4 }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ height: { xs: 64, sm: 72 }, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              <motion.div whileHover={{ rotate: 10 }}>
                <Box sx={{ 
                  background: `linear-gradient(135deg, #6366f1 0%, #ec4899 100%)`,
                  p: { xs: 0.8, sm: 1.2 },
                  borderRadius: '12px',
                  display: 'flex',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
                }}>
                  <MessageSquare color="white" size={window.innerWidth < 600 ? 18 : 22} />
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
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  background: 'linear-gradient(to right, #6366f1, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Orbit
              </Typography>
            </Box>

            {/* Desktop Nav */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {token ? menuItems.map((item) => (
                <NavLink 
                  key={item.path}
                  $active={location.pathname === item.path}
                  onClick={() => handleNav(item.path)}
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
              <IconButton onClick={toggleTheme} sx={{ p: { xs: 0.8, sm: 1.2 }, border: '1px solid', borderColor: 'divider' }}>
                {mode === 'dark' ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#6366f1" />}
              </IconButton>
              
              {token && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1 }}>{displayUsername}</Typography>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>Pro Member</Typography>
                  </Box>
                  <IconButton 
                    onClick={(e) => {
                      if (window.innerWidth < 900) setDrawerOpen(true);
                      else setUserMenuAnchor(e.currentTarget);
                    }} 
                    sx={{ p: 0.5, border: '2px solid', borderColor: 'primary.main' }}
                  >
                    <Avatar src={displayProfile} sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                      {displayUsername[0]?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Box>
              )}
              
              {!token && (
                <IconButton 
                  sx={{ display: { xs: 'flex', md: 'none' } }}
                  onClick={() => setDrawerOpen(true)}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </Container>
      </GlassAppBar>

      {/* Profile Menu (Desktop Only) */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
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
            borderColor: 'divider',
            backdropFilter: 'blur(10px)',
            background: alpha(mode === 'dark' ? '#0f172a' : '#fff', 0.9)
          }
        }}
      >
        <Box sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={800}>{displayUsername}</Typography>
          <Typography variant="caption" color="text.secondary">Account Management</Typography>
        </Box>
        <MenuItem onClick={() => handleNav("/profile")} sx={{ borderRadius: '12px', gap: 1.5, py: 1 }}>
          <Settings size={18} /> Settings
        </MenuItem>
        <Divider sx={{ my: 1, opacity: 0.5 }} />
        <MenuItem onClick={handleLogout} sx={{ borderRadius: '12px', gap: 1.5, py: 1, color: 'error.main' }}>
          <LogOut size={18} /> Sign Out
        </MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: alpha(mode === 'dark' ? '#0f172a' : '#fff', 0.8),
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid',
            borderColor: 'divider',
            p: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 1 }}>
          <Typography variant="h6" fontWeight={900}>Orbit Menu</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><X /></IconButton>
        </Box>

        {token && (
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Avatar src={displayProfile} sx={{ width: 64, height: 64, mx: 'auto', mb: 1.5, border: '3px solid', borderColor: 'primary.main', p: 0.5 }}>
              {displayUsername[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="h6" fontWeight={800}>{displayUsername}</Typography>
            <Typography variant="caption" color="primary.main" fontWeight={700}>PRO MEMBER</Typography>
          </Box>
        )}

        <List sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
          {token ? menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton 
                onClick={() => handleNav(item.path)}
                selected={location.pathname === item.path}
                sx={{ 
                  borderRadius: '12px',
                  bgcolor: location.pathname === item.path ? alpha('#6366f1', 0.1) : 'transparent',
                  color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  '&.Mui-selected': { bgcolor: alpha('#6366f1', 0.1), color: 'primary.main' }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  <item.icon size={20} />
                </ListItemIcon>
                <ListItemText primary={<Typography fontWeight={700}>{item.label}</Typography>} />
              </ListItemButton>
            </ListItem>
          )) : (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNav("/login")} sx={{ borderRadius: '12px' }}>
                  <ListItemText primary="Login" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNav("/register")} sx={{ borderRadius: '12px', bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                  <ListItemText primary="Join Orbit" />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>

        {token && (
          <Box sx={{ mt: 'auto', pb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: '12px', color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogOut size={20} /></ListItemIcon>
              <ListItemText primary={<Typography fontWeight={700}>Sign Out</Typography>} />
            </ListItemButton>
          </Box>
        )}
      </Drawer>
    </>
  );
}

export default Navbar;
