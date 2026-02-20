import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Link,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import { 
  Mail, 
  Phone, 
  Lock, 
  Camera,
  User,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import ProfileImg from "../Assets/profile01.webp";
import { useUI } from "../context/UIProvider";

const API = process.env.REACT_APP_API || "http://localhost:5000";

const AuthPage = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(4, 3),
  position: 'relative',
  overflow: 'hidden',
}));

const GlassBox = styled(motion.div)(({ theme }) => ({
  width: "100%",
  maxWidth: "520px",
  padding: theme.spacing(6),
  background: alpha(theme.palette.background.paper, 0.45),
  backdropFilter: "blur(30px)",
  borderRadius: "32px",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 20px 40px -10px ${alpha(theme.palette.common.black, 0.1)}`,
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4, 2.5),
    borderRadius: '24px',
  },
}));

const InputField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(theme.palette.common.white, 0.05),
    borderRadius: '16px',
    transition: 'all 0.2s',
    '& fieldset': { borderColor: 'transparent' },
    '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.08) },
    '&.Mui-focused': {
       backgroundColor: alpha(theme.palette.common.white, 0.1),
       '& fieldset': { borderColor: theme.palette.primary.main },
    },
  },
}));

const FloatingParticle = styled(motion.div)(({ color }) => ({
  position: 'absolute',
  width: '350px',
  height: '350px',
  borderRadius: '50%',
  filter: 'blur(120px)',
  background: color,
  zIndex: 0,
  opacity: 0.35,
}));

function Register({ setToken }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState(ProfileImg);
  const [password, setPassword] = useState("");
  const { showToast } = useUI();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile(reader.result.toString());
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/auth/register`, {
        username, email, phone, profile, password,
      });
      localStorage.setItem("token", data.token);
      if (setToken) setToken(data.token);
      showToast("Welcome to the fleet!", "success");
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.message || "Registration encountered an error.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPage>
      <FloatingParticle 
        color="#8b5cf6" 
        animate={{ x: [-50, 50], y: [-50, 50] }} 
        transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
        style={{ top: '10%', right: '5%' }}
      />
      <FloatingParticle 
        color="#2dd4bf" 
        animate={{ x: [50, -50], y: [50, -50] }} 
        transition={{ duration: 18, repeat: Infinity, repeatType: 'reverse' }}
        style={{ bottom: '10%', left: '5%' }}
      />

      <GlassBox
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: { xs: 3, sm: 4 }, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-1.5px', mb: 1, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Join the Orbit
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
            Your journey through the social galaxy starts here.
          </Typography>
        </Box>



        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Avatar 
                  src={profile} 
                  sx={{ width: { xs: 90, sm: 110 }, height: { xs: 90, sm: 110 }, border: '4px solid', borderColor: 'primary.main', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }} 
                />
              </motion.div>
              <IconButton
                component="label"
                sx={{
                  position: 'absolute', bottom: -5, right: -5, bgcolor: 'primary.main', color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', p: 1.2
                }}
              >
                <input hidden accept="image/*" type="file" onChange={handleFileChange} />
                <Camera size={20} />
              </IconButton>
            </Box>
          </Box>

          <InputField
            fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required
            InputProps={{ startAdornment: <InputAdornment position="start"><User size={20} /></InputAdornment> }}
          />
          <InputField
            fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={20} /></InputAdornment> }}
          />
          <InputField
            fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={20} /></InputAdornment> }}
          />
          <InputField
            fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            InputProps={{ startAdornment: <InputAdornment position="start"><Lock size={20} /></InputAdornment> }}
          />
          
          <Button
            fullWidth variant="contained" size="large" type="submit" disabled={isLoading}
            endIcon={!isLoading && <ArrowRight size={20} />}
            sx={{ py: 2, borderRadius: '16px', fontSize: '1.05rem', fontWeight: 800, mt: 2 }}
          >
            {isLoading ? "Preparing ship..." : "Launch Account"}
          </Button>
        </Box>

        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Already a member?{" "}
            <Link component={RouterLink} to="/login" sx={{ fontWeight: 800, textDecoration: 'none', color: 'primary.main' }}>
              Back to Base
            </Link>
          </Typography>
        </Box>
      </GlassBox>
    </AuthPage>
  );
}

export default Register;
