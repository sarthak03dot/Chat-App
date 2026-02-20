import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import { 
  LogIn, 
  User, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useUI } from "../context/UIProvider";

const API = process.env.REACT_APP_API || "http://localhost:5000";

const AuthPage = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
}));

const GlassBox = styled(motion.div)(({ theme }) => ({
  width: "100%",
  maxWidth: "480px",
  padding: theme.spacing(6),
  background: alpha(theme.palette.background.paper, 0.45),
  backdropFilter: "blur(30px)",
  borderRadius: "32px",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 20px 40px -10px ${alpha(theme.palette.common.black, 0.1)}`,
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4, 3),
    borderRadius: '24px',
  },
}));

const InputField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(theme.palette.common.white, 0.05),
    borderRadius: '16px',
    transition: 'all 0.2s',
    '& fieldset': { borderColor: 'transparent' },
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.08),
    },
    '&.Mui-focused': {
       backgroundColor: alpha(theme.palette.common.white, 0.1),
       '& fieldset': { borderColor: theme.palette.primary.main },
    },
  },
}));

const FloatingParticle = styled(motion.div)(({ color }) => ({
  position: 'absolute',
  width: '300px',
  height: '300px',
  borderRadius: '50%',
  filter: 'blur(100px)',
  background: color,
  zIndex: 0,
  opacity: 0.4,
}));

function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useUI();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, { username, password });
      localStorage.setItem("token", data.token);
      setToken(data.token);
      showToast("Welcome back, Commander!", "success");
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid credentials. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPage>
      <FloatingParticle 
        color="#6366f1" 
        animate={{ 
          x: [-100, 100], 
          y: [-100, 100],
          scale: [1, 1.2, 1]
        }} 
        transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
        style={{ top: '20%', left: '10%' }}
      />
      <FloatingParticle 
        color="#ec4899" 
        animate={{ 
          x: [100, -100], 
          y: [100, -100],
          scale: [1.2, 1, 1.2]
        }} 
        transition={{ duration: 12, repeat: Infinity, repeatType: 'reverse' }}
        style={{ bottom: '20%', right: '10%' }}
      />

      <GlassBox
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box sx={{ mb: { xs: 4, sm: 6 }, textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, delay: 0.2 }}
          >
            <Box sx={{ 
              display: 'inline-flex', 
              p: { xs: 1.5, sm: 2 }, 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              color: 'white',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
              mb: { xs: 2, sm: 3 }
            }}>
              <LogIn size={window.innerWidth < 600 ? 24 : 32} />
            </Box>
          </motion.div>
          
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-1.5px', mb: 1, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Sign In to Orbit
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Connect back with your universe.
          </Typography>
        </Box>



        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <InputField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start"><User size={20} /></InputAdornment>,
            }}
          />
          <InputField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock size={20} /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={isLoading}
            endIcon={!isLoading && <ArrowRight size={20} />}
            sx={{ 
              py: 2, 
              borderRadius: '16px',
              fontSize: '1rem',
              fontWeight: 800,
              boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)'
            }}
          >
            {isLoading ? "Venturing In..." : "Enter Orbit"}
          </Button>
        </Box>

        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <Link component={RouterLink} to="/register" sx={{ fontWeight: 800, textDecoration: 'none', color: 'primary.main', '&:hover': { opacity: 0.8 } }}>
              Join Orbit Today
            </Link>
          </Typography>
        </Box>
      </GlassBox>
    </AuthPage>
  );
}

export default Login;