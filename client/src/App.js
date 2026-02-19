import React, { useEffect, useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import {
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  styled,
  Typography,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { UIProvider } from "./context/UIProvider";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Chat from "./components/Chat";
import Navbar from "./components/Navbar";
import Profile from "./components/Profile";
import Groups from "./components/Groups";
import Footer from "./components/Footer";
import "./App.css";

// Styled components
const AppContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  transition: "background 0.3s ease-in-out",
}));

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  marginTop: theme.spacing(8),
  position: "relative",
  [theme.breakpoints.down("sm")]: {
    marginTop: theme.spacing(7),
  },
}));

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    style={{ width: "100%", height: "100%" }}
  >
    {children}
  </motion.div>
);

const PendingPage = () => (
  <Box sx={{ textAlign: "center", mt: { xs: "50%", sm: "40%" } }}>
    <Typography variant="h4" sx={{ fontWeight: "bold", color: "text.primary" }}>
      Page Under Construction
    </Typography>
  </Box>
);

const createAppTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#6366f1", // Indigo
        light: "#818cf8",
        dark: "#4f46e5",
      },
      secondary: {
        main: "#ec4899", // Pink
      },
      background: {
        default: mode === "dark" ? "#0f172a" : "#f8fafc",
        paper: mode === "dark" ? "#1e293b" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#f8fafc" : "#0f172a",
        secondary: mode === "dark" ? "#94a3b8" : "#64748b",
      },
      divider: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            height: "100%",
          },
          body: {
            height: "100%",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: "8px 20px",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            boxShadow: mode === 'dark' 
              ? '0 4px 20px rgba(0,0,0,0.4)' 
              : '0 4px 20px rgba(0,0,0,0.05)',
            border: mode === 'dark' 
              ? '1px solid rgba(255,255,255,0.05)'
              : '1px solid rgba(0,0,0,0.05)',
          },
        },
      },
    },
  });

function AnimatedRoutes({ token, setToken, toggleTheme }) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              {token ? (
                <Dashboard token={token} setToken={setToken} />
              ) : (
                <Login setToken={setToken} />
              )}
            </PageWrapper>
          }
        />
        <Route path="/register" element={<PageWrapper><Register setToken={setToken} /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login setToken={setToken} /></PageWrapper>} />
        <Route path="/pending" element={<PageWrapper><PendingPage /></PageWrapper>} />
        <Route
          path="/chat/:userId"
          element={<PageWrapper><Chat token={token} /></PageWrapper>}
        />
        <Route
          path="/chat/group/:groupId"
          element={<PageWrapper><Chat token={token} /></PageWrapper>}
        />
        <Route
          path="/groups"
          element={<PageWrapper><Groups token={token} setToken={setToken} /></PageWrapper>}
        />
        <Route path="/profile" element={<PageWrapper><Profile token={token} /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [mode, setMode] = useState(
    localStorage.getItem("theme") === "dark" ? "dark" : "light"
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", newMode);
      return newMode;
    });
  };

  useEffect(() => {
    document.body.className = mode;
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UIProvider>
        <Router>
          <AppContainer>
            <Navbar token={token} setToken={setToken} toggleTheme={toggleTheme} mode={mode} />
            <MainContent>
              <AnimatedRoutes token={token} setToken={setToken} toggleTheme={toggleTheme} />
            </MainContent>
            <Footer />
          </AppContainer>
        </Router>
      </UIProvider>
    </ThemeProvider>
  );
}

export default App;
