import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import io from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Skeleton,
  Badge,
  Grid,
} from "@mui/material";
import { 
  Plus, 
  Search, 
  Activity, 
  MessageSquare, 
  Users, 
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles
} from "lucide-react";
import { styled, alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "../context/UIProvider";

const API = process.env.REACT_APP_API || "http://localhost:5000";

// Persistent socket instance for the component's lifecycle
const socket = io(API, { autoConnect: false, transports: ['websocket', 'polling'] });

const DashboardLayout = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 64px)',
  display: 'flex',
  gap: theme.spacing(3),
  padding: theme.spacing(3),
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    height: 'auto',
    overflow: 'visible'
  }
}));

const CardPanel = styled(motion.div)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.45),
  backdropFilter: 'blur(16px)',
  borderRadius: '24px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: `0 8px 32px -4px ${alpha(theme.palette.common.black, 0.05)}`,
}));

const Sidebar = styled(CardPanel)(({ theme }) => ({
  width: '340px',
  flexShrink: 0,
  [theme.breakpoints.down('md')]: {
    width: '100%',
    height: '400px'
  }
}));

const MainArena = styled(CardPanel)(({ theme }) => ({
  flex: 1,
  overflow: 'auto'
}));

const SearchField = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  display: 'flex',
  alignItems: 'center',
  background: alpha(theme.palette.background.default, 0.4),
  borderRadius: '16px',
  margin: theme.spacing(2, 3),
  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  '&:focus-within': {
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

const ChatNavItem = styled(motion.div)(({ theme, $active }) => ({
  padding: theme.spacing(2, 3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  borderLeft: `4px solid ${$active ? theme.palette.primary.main : 'transparent'}`,
  background: $active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
  '&:hover': {
    background: alpha(theme.palette.text.primary, 0.03),
  },
}));

function Dashboard({ token }) {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const [conversations, setConversations] = useState([]);
  const [recentMsgs, setRecentMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const currentUserId = token ? jwtDecode(token).userId : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, mRes] = await Promise.all([
          axios.get(`${API}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/api/chat/activity`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setConversations(cRes.data);
        setRecentMsgs(mRes.data || []);
      } catch (err) {
        // Silent fail or show toast if critical
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
      socket.connect();
      socket.emit('join', { userId: currentUserId });

      socket.on('userStatus', ({ userId: statusUserId, online }) => {
        setConversations(prev => prev.map(c => 
          (c.type === 'private' && c._id === statusUserId) ? { ...c, online } : c
        ));
      });

      socket.on('receiveMessage', () => {
        fetchData();
      });

      return () => {
        socket.off('userStatus');
        socket.off('receiveMessage');
        socket.disconnect();
      };
    }
  }, [token, currentUserId]);

  const stats = useMemo(() => {
    const unreadTotal = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    return [
      { label: 'Unread Glows', value: unreadTotal, icon: MessageSquare, color: '#6366f1' },
      { label: 'Active Orbits', value: conversations.filter(c => c.type === 'private' && c.online).length, icon: Activity, color: '#10b981' },
      { label: 'Frequencies', value: conversations.filter(c => c.type === 'group').length, icon: TrendingUp, color: '#ec4899' }
    ];
  }, [conversations]);

  const filteredConversations = useMemo(() => 
    conversations.filter(c => c.display.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );

  const handleCreateGroup = async () => {
    try {
      if (!newGroupName.trim()) return;
      const { data } = await axios.post(`${API}/api/groups`, 
        { name: newGroupName }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenDialog(false);
      setNewGroupName("");
      navigate(`/chat/group/${data._id}`);
      showToast("Orbit successfully initialized", "success");
    } catch (err) {
        showToast("Failed to initialize orbit", "error");
    }
  };

  return (
    <DashboardLayout>
      <Sidebar initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
        <Box sx={{ p: 3, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={900} sx={{ color: 'primary.main', letterSpacing: '-1px' }}>Orbit Hub</Typography>
          <Tooltip title="Create Frequency">
            <IconButton onClick={() => setOpenDialog(true)} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>
              <Plus size={20} />
            </IconButton>
          </Tooltip>
        </Box>

        <SearchField>
          <Search size={18} color={alpha('#000', 0.4)} />
          <TextField 
            fullWidth 
            variant="standard" 
            placeholder="Search communications..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { px: 1.5, fontSize: '0.9rem' } }}
          />
        </SearchField>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
          <Typography variant="overline" sx={{ px: 2, mt: 2, display: 'block', opacity: 0.6, fontWeight: 800 }}>Vessel Streams</Typography>
          <AnimatePresence>
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <Box key={i} sx={{ p: 2, display: 'flex', gap: 2 }}>
                  <Skeleton variant="circular" width={44} height={44} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                </Box>
              ))
            ) : (
              filteredConversations.map((conv) => (
                <ChatNavItem 
                  key={conv._id} 
                  onClick={() => navigate(conv.type === 'group' ? `/chat/group/${conv._id}` : `/chat/${conv._id}`)}
                  whileHover={{ x: 5, background: alpha('#6366f1', 0.05) }}
                  $active={false}
                >
                  <Box sx={{ position: 'relative' }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      invisible={conv.type !== 'private' || !conv.online}
                      sx={{ '& .MuiBadge-badge': { backgroundColor: '#10b981', color: '#10b981', boxShadow: '0 0 0 2px white' } }}
                    >
                      <Avatar 
                        src={conv.profile && `${API}/${conv.profile}`} 
                        sx={{ 
                          width: 44, 
                          height: 44, 
                          background: conv.type === 'group' ? 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' : 'primary.main',
                          border: '2px solid white', 
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
                        }}
                      >
                        {conv.type === 'group' ? <Users size={20} /> : conv.display[0]}
                      </Avatar>
                    </Badge>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                       <Typography variant="subtitle2" fontWeight={800} noWrap>{conv.display}</Typography>
                       {conv.lastMessage && (
                         <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.65rem' }}>
                           {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </Typography>
                       )}
                    </Box>
                    <Typography variant="caption" noWrap sx={{ opacity: 0.6, display: 'block' }}>
                      {conv.lastMessage ? (
                        `${conv.lastMessage.isMine ? 'You: ' : ''}${conv.lastMessage.content}`
                      ) : (
                        conv.type === 'group' ? `${conv.membersCount} members` : 'Start transmission'
                      )}
                    </Typography>
                  </Box>
                  {conv.unreadCount > 0 && (
                    <Box sx={{ minWidth: 18, height: 18, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 900 }}>
                      {conv.unreadCount}
                    </Box>
                  )}
                </ChatNavItem>
              ))
            )}
          </AnimatePresence>
        </Box>
      </Sidebar>

      <MainArena initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Box sx={{ p: 1.5, borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', color: 'white', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)' }}>
              <Sparkles size={28} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-1.5px', fontSize: { xs: '1.5rem', md: '2.125rem' } }}>Welcome, {token ? jwtDecode(token).username : 'User'}</Typography>
              <Typography color="text.secondary" fontWeight={500}>The galaxy is currently at {conversations.filter(c=>c.type==='private' && c.online).length} active peer connections.</Typography>
            </Box>
          </Box>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {stats.map((stat, i) => (
                    <Box 
                      key={i} 
                      component={motion.div} 
                      whileHover={{ y: -5, boxShadow: `0 10px 30px ${alpha(stat.color, 0.15)}` }} 
                      sx={{ p: 3, borderRadius: '24px', background: alpha(stat.color, 0.05), border: `1px solid ${alpha(stat.color, 0.1)}`, display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <stat.icon size={22} color={stat.color} />
                         <Typography variant="caption" fontWeight={900} color={stat.color} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</Typography>
                      </Box>
                      <Typography variant="h3" fontWeight={900}>{stat.value}</Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ p: 4, borderRadius: '32px', background: alpha('#fff', 0.4), backdropFilter: 'blur(20px)', border: `1px solid ${alpha('#000', 0.03)}`, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" fontWeight={900} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Clock size={22} color="#6366f1" /> Frequency Logs
                  </Typography>
                  
                  {recentMsgs.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {recentMsgs.map((msg, i) => (
                        <Box key={i} component={motion.div} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} sx={{ p: 2, borderRadius: '20px', background: alpha('#fff', 0.5), display: 'flex', alignItems: 'center', gap: 2, border: '1px solid transparent', '&:hover': { borderColor: alpha('#6366f1', 0.2), background: alpha('#fff', 0.8) } }}>
                          <Avatar src={msg.sender?.profile && `${API}/${msg.sender.profile}`} sx={{ width: 40, height: 40, border: '2px solid white' }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              <span style={{ color: '#6366f1' }}>{msg.sender?.username}</span>: {msg.content.substring(0, 80)}{msg.content.length > 80 ? '...' : ''}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.5 }}>{new Date(msg.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 5 }}>
                      <Box sx={{ mb: 3, opacity: 0.1, color: 'primary.main' }}>
                        <MessageSquare size={100} strokeWidth={1} />
                      </Box>
                      <Typography variant="h6" fontWeight={800}>Silence in the Vacuum</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '300px', mt: 1 }}>Your communication logs are currently empty. Start a transmission to see signal pulses here.</Typography>
                      <Button variant="contained" onClick={() => navigate('/groups')} sx={{ mt: 3, borderRadius: '12px', fontWeight: 900, px: 4 }}>Explore Frequencies</Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Box sx={{ p: 4, borderRadius: '32px', background: alpha('#fff', 0.4), backdropFilter: 'blur(20px)', border: `1px solid ${alpha('#000', 0.03)}` }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 3 }}>Suggested Orbits</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {conversations.filter(c => c.type === 'group').slice(0, 3).map((group) => (
                      <Box key={group._id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', width: 48, height: 48, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}><Users size={20} /></Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={800}>{group.display}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.6 }}>{group.membersCount} pilots synced</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => navigate(`/chat/group/${group._id}`)} sx={{ bgcolor: alpha('#6366f1', 0.1), color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                          <ChevronRight size={18} />
                        </IconButton>
                      </Box>
                    ))}
                    {conversations.filter(c => c.type === 'group').length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>No frequencies manifest in this sector yet.</Typography>
                    )}
                    <Button fullWidth variant="outlined" startIcon={<Plus size={18} />} onClick={() => setOpenDialog(true)} sx={{ mt: 1, borderRadius: '12px', fontWeight: 800, borderColor: alpha('#6366f1', 0.3) }}>Manifest Orbit</Button>
                  </Box>
                </Box>

                <Box sx={{ p: 4, borderRadius: '32px', background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', color: 'white', boxShadow: '0 15px 35px rgba(99, 102, 241, 0.3)', position: 'relative', overflow: 'hidden' }}>
                   <Box sx={{ position: 'relative', zIndex: 1 }}>
                     <Typography variant="subtitle1" fontWeight={900}>Orbit Pro Station</Typography>
                     <Typography variant="body2" sx={{ my: 1.5, opacity: 0.9, lineHeight: 1.6 }}>Upgrade your vessel to access encrypted mass-transmissions and priority cloud range.</Typography>
                     <Button fullWidth sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 900, py: 1.5, borderRadius: '12px', '&:hover': { bgcolor: alpha('#fff', 0.9), transform: 'scale(1.02)' }, transition: 'all 0.3s' }}>Unlock Galaxy</Button>
                   </Box>
                   <Sparkles size={80} style={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.2, transform: 'rotate(-20deg)' }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </MainArena>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1, backdropFilter: 'blur(30px)', background: alpha('#fff', 0.85), border: '1px solid rgba(255,255,255,0.3)' } }}>
        <DialogTitle fontWeight={900} sx={{ letterSpacing: '-1px', fontSize: '1.5rem' }}>Open New Frequency</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>Initialize a collective channel for multi-user transmissions across the orbit.</Typography>
          <TextField 
            fullWidth 
            label="Frequency Name" 
            variant="outlined" 
            autoFocus
            value={newGroupName} 
            onChange={(e) => setNewGroupName(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', background: alpha('#000', 0.03) } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: '12px', fontWeight: 800, color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateGroup} disabled={!newGroupName.trim()} sx={{ borderRadius: '12px', px: 4, fontWeight: 800, boxShadow: '0 8px 15px rgba(99, 102, 241, 0.3)' }}>Initiate Sector</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default Dashboard;
