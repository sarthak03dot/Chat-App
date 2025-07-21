import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  styled,
  Typography,
} from "@mui/material";
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
  backgroundColor: theme.palette.background.default,
}));

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  marginTop: theme.spacing(8), // Space for fixed AppBar
  [theme.breakpoints.down("sm")]: {
    marginTop: theme.spacing(7),
  },
}));

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
        main: mode === "dark" ? "#ffb71a" : "#2e7d32", // --primary-color
        dark: "#1a237e", 
        light: "#29b6f6",
      },
      secondary: {
        main: "#d32f2f", // --secondary-color
      },
      background: {
        default: mode === "dark" ? "#9c9a9a" : "#f5f5f5", // --background-neutral
        paper: mode === "dark" ? "#424242" : "#ffffff", // --accent-color
      },
      text: {
        primary: mode === "dark" ? "#ffffff" : "#212121", // --text-neutral
      },
      divider: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
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
    },
  });

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [mode, setMode] = useState(
    localStorage.getItem("theme") === "dark" ? "dark" : "light"
  );

  // Update theme mode
  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", newMode);
      return newMode;
    });
  };

  return (
    <ThemeProvider theme={createAppTheme(mode)}>
      <CssBaseline />
      <Router>
        <AppContainer>
          <Navbar token={token} setToken={setToken} toggleTheme={toggleTheme} />
          <MainContent>
            <Routes>
              <Route
                path="/"
                element={
                  token ? (
                    <Dashboard token={token} setToken={setToken} />
                  ) : (
                    <Login setToken={setToken} />
                  )
                }
              />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login setToken={setToken} />} />
              <Route path="/pending" element={<PendingPage />} />
              <Route
                path="/chat/private/:userId"
                element={<Chat token={token} />}
              />
              <Route
                path="/chat/group/:groupId"
                element={<Chat token={token} />}
              />
              <Route
                path="/groups"
                element={<Groups token={token} setToken={setToken} />}
              />
              <Route path="/profile" element={<Profile token={token} />} />
            </Routes>
          </MainContent>
          <Footer />
        </AppContainer>
      </Router>
    </ThemeProvider>
  );
}

export default App;
