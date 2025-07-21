import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";
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
} from "@mui/material";
import {
  Menu as MenuIcon,
  LightMode,
  DarkMode,
  Logout,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const API = process.env.REACT_APP_API;

// Styled components for custom styling
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  boxShadow: theme.shadows[3],
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: theme.spacing(0, 2),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0, 1),
  },
}));

const NavBrand = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  "& a": {
    textDecoration: "none",
    color: theme.palette.common.white,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
}));

const NavLinks = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

const NavUser = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  display: "none",
  [theme.breakpoints.down("md")]: {
    display: "block",
  },
}));

function Navbar({ token, setToken }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [menuOpen, setMenuOpen] = useState(null);
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const userId = token ? jwtDecode(token).userId : null;

  useEffect(() => {
    if (token && userId) {
      const decodedToken = jwtDecode(token);
      const tokenUsername =
        decodedToken.username || decodedToken.name || decodedToken.user || null;
      if (tokenUsername) {
        setUsername(tokenUsername);
      } else {
        // Fetch username from backend if not in token
        axios
          .get(`${API}/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((response) => {
            setUsername(response.data.username || "User");
          })
          .catch((err) => {
            console.error("Failed to fetch username:", err);
            setUsername("User"); // Fallback
          });
      }
    }
  }, [token, userId]);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
    setMenuOpen(null);
  };

  const handleMenuOpen = (event) => {
    setMenuOpen(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuOpen(null);
  };

  return (
    <StyledAppBar position="static">
      <StyledToolbar>
        <NavBrand>
          <RouterLink to="/">
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Let's Chat
            </Typography>
            <Avatar sx={{ bgcolor: "transparent", fontSize: "1.5rem" }}>
              💬
            </Avatar>
          </RouterLink>
        </NavBrand>

        {token && (
          <NavUser>
            <Typography variant="body1">
              Welcome, <b>{username}</b>
            </Typography>
          </NavUser>
        )}

        <NavLinks>
          {token ? (
            <>
              <Button color="inherit" component={RouterLink} to="/">
                Dashboard
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to={`/chat/private/${userId}`}
              >
                Chats
              </Button>
              <Button color="inherit" component={RouterLink} to="/groups">
                Groups
              </Button>
              <Button color="inherit" component={RouterLink} to="/profile">
                Profile
              </Button>
              <IconButton
                color="inherit"
                onClick={toggleTheme}
                title="Toggle Theme"
              >
                {isDark ? <LightMode /> : <DarkMode />}
              </IconButton>
              <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<Logout />}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
              <IconButton
                color="inherit"
                onClick={toggleTheme}
                title="Toggle Theme"
              >
                {isDark ? <LightMode /> : <DarkMode />}
              </IconButton>
            </>
          )}
        </NavLinks>

        <MobileMenuButton
          color="inherit"
          onClick={handleMenuOpen}
          aria-label="menu"
        >
          <MenuIcon />
        </MobileMenuButton>

        <Menu
          anchorEl={menuOpen}
          open={Boolean(menuOpen)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 200 },
          }}
        >
          {token ? (
            <>
              <MenuItem onClick={handleMenuClose} component={RouterLink} to="/">
                Dashboard
              </MenuItem>
              <MenuItem
                onClick={handleMenuClose}
                component={RouterLink}
                to={`/chat/private/${userId}`}
              >
                Chats
              </MenuItem>
              <MenuItem
                onClick={handleMenuClose}
                component={RouterLink}
                to="/groups"
              >
                Groups
              </MenuItem>
              <MenuItem
                onClick={handleMenuClose}
                component={RouterLink}
                to="/profile"
              >
                Profile
              </MenuItem>
              <MenuItem onClick={toggleTheme}>
                {isDark ? "Light Theme" : "Dark Theme"}
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </>
          ) : (
            <>
              <MenuItem
                onClick={handleMenuClose}
                component={RouterLink}
                to="/login"
              >
                Login
              </MenuItem>
              <MenuItem
                onClick={handleMenuClose}
                component={RouterLink}
                to="/register"
              >
                Register
              </MenuItem>
              <MenuItem onClick={toggleTheme}>
                {isDark ? "Light Theme" : "Dark Theme"}
              </MenuItem>
            </>
          )}
        </Menu>
      </StyledToolbar>
    </StyledAppBar>
  );
}

export default Navbar;
