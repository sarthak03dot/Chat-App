import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Grid,
  CircularProgress,
} from "@mui/material";

import { 
  Camera, 
  Save, 
  Mail, 
  Phone, 
  User, 
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Zap,
  Globe
} from "lucide-react";
import { styled, alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "../context/UIProvider";

const API = process.env.REACT_APP_API || "http://localhost:5000";

const ProfileContainer = styled(Box)(({ theme }) => ({
  minHeight: 'calc(100vh - 80px)',
  padding: theme.spacing(4),
  maxWidth: '1100px',
  margin: '0 auto',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const GlassCard = styled(motion.div)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(20px)",
  borderRadius: "32px",
  padding: theme.spacing(4),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  height: '100%',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2),
    borderRadius: '24px',
  }
}));

const StyledInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    backgroundColor: alpha(theme.palette.text.primary, 0.03),
    transition: 'all 0.3s ease',
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.2) },
    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    '&.Mui-focused': {
       boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '16px',
  padding: '12px 24px',
  fontWeight: 800,
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  }
}));

function Profile({ token }) {
  const navigate = useNavigate();
  const userId = token ? jwtDecode(token).userId : null;
  const [userData, setUserData] = useState({ username: "User", email: "", phone: "", profile: "" });
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useUI();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await axios.get(`${API}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(data);
        setNewUsername(data.username);
      } catch (err) {
        showToast("Mission failed: Could not retrieve data", "error");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchUserData();
  }, [token, userId, showToast]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedProfile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (type, payload) => {
    if ((type === 'Username' && !newUsername.trim()) || (type === 'Password' && !newPassword.trim())) return;
    
    setSaving(true);
    try {
      const { data } = await axios.put(`${API}/api/users/${userId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast(`${type} updated successfully!`, "success");
      if (data.user) setUserData(data.user);
      if (payload.username) setNewUsername(payload.username);
      if (payload.password) setNewPassword("");
    } catch (err) {
      showToast(`Hull breach: Failed to update ${type}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const updateProfilePic = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.append("profile", selectedProfile);
    try {
      const { data } = await axios.put(`${API}/api/upload/${userId}/profile`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        },
      });
      setUserData(prev => ({ ...prev, profile: data.profile }));
      showToast("Profile picture updated!", "success");
      setSelectedProfile(null);
    } catch (err) {
      showToast("Signal lost: Mirror update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress thickness={5} size={50} sx={{ color: 'primary.main' }} />
    </Box>
  );

  return (
    <ProfileContainer>
      <Box sx={{ mb: { xs: 4, sm: 6 }, display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 2, sm: 3 } }}>
        <IconButton onClick={() => navigate('/')} sx={{ mt: { xs: 0.5, sm: 0 }, background: alpha('#fff', 0.5), backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <ArrowLeft size={24} />
        </IconButton>
        <Box>
          <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '-2px', fontSize: { xs: '1.75rem', sm: '3rem' } }}>Pilot Profile</Typography>
          <Typography color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Control your identity across the Orbit galaxy.</Typography>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 3, md: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative', mb: 4 }}>
                <Avatar 
                  src={previewUrl || (userData.profile ? `${API}/${userData.profile}` : "")}
                  sx={{ width: { xs: 140, sm: 180 }, height: { xs: 140, sm: 180 }, border: '6px solid white', boxShadow: '0 15px 40px rgba(99,102,241,0.3)' }}
                />
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <IconButton 
                    component="label" 
                    sx={{ position: 'absolute', bottom: 5, right: 5, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, p: 1.5, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
                  >
                    <input hidden type="file" onChange={handleFileChange} />
                    <Camera size={20} />
                  </IconButton>
                </motion.div>
              </Box>
              
              <Typography variant="h5" fontWeight={900} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>{userData.username}</Typography>
              <Typography color="primary.main" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.7rem', mt: 1 }}>Orbit Fleet Officer</Typography>
              
              <AnimatePresence>
                {selectedProfile && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} style={{ width: '100%', marginTop: '24px' }}>
                    <ActionButton variant="contained" onClick={updateProfilePic} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />} fullWidth>
                      Deploy New Avatar
                    </ActionButton>
                  </motion.div>
                )}
              </AnimatePresence>

              <Box sx={{ mt: 5, width: '100%', p: { xs: 2.5, sm: 3 }, borderRadius: '24px', background: alpha('#000', 0.03) }}>
                 <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, display: 'block' }}>Signal Metrics</Typography>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Mail size={18} color="#6366f1" />
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userData.email}</Typography>
                 </Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Phone size={18} color="#6366f1" />
                    <Typography variant="body2" fontWeight={600}>{userData.phone || "No link established"}</Typography>
                 </Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Globe size={18} color="#6366f1" />
                    <Typography variant="body2" fontWeight={600}>Sector Earth-1</Typography>
                 </Box>
              </Box>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 4 } }}>
            <GlassCard initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                <User size={24} color="#6366f1" /> Vessel Designation
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <StyledInput
                    fullWidth
                    label="Holographic Name"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ActionButton 
                    variant="contained" 
                    onClick={() => handleUpdate('Username', { username: newUsername })}
                    disabled={saving || !newUsername.trim() || newUsername === userData.username}
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Sparkles size={18} />}
                  >
                    Sync Credentials
                  </ActionButton>
                </Grid>
              </Grid>
            </GlassCard>

            <GlassCard initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                <ShieldCheck size={24} color="#ec4899" /> Encryption Core
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <StyledInput
                    fullWidth
                    label="New Access Key"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </IconButton>
                      )
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ActionButton 
                    variant="outlined" 
                    onClick={() => handleUpdate('Password', { password: newPassword })}
                    disabled={saving || !newPassword.trim()}
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Zap size={18} />}
                    sx={{ borderColor: alpha('#ec4899', 0.5), color: '#ec4899', '&:hover': { borderColor: '#ec4899', background: alpha('#ec4899', 0.05), boxShadow: '0 8px 25px rgba(236, 72, 153, 0.3)' } }}
                  >
                    Re-encrypt Core
                  </ActionButton>
                </Grid>
              </Grid>
            </GlassCard>
          </Box>
        </Grid>
      </Grid>
    </ProfileContainer>
  );
}

export default Profile;