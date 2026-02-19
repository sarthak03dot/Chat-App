import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar,
  Dialog,
  Skeleton,
} from '@mui/material';
import { 
  Send, 
  MoreHorizontal, 
  ArrowLeft,
  Smile,
  CheckCheck,
  Users,
  Info,
  Plus,
  Image,
  Reply,
  X
} from 'lucide-react';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

const API = process.env.REACT_APP_API || "http://localhost:5000";

const socket = io(`${API}`, { transports: ['websocket', 'polling'] });

const ChatWindow = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 40px)',
  width: '100%',
  maxWidth: '1200px',
  margin: '20px auto',
  display: 'flex',
  flexDirection: 'column',
  background: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: 'blur(40px)',
  borderRadius: '32px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  overflow: 'hidden',
  boxShadow: '0 25px 80px rgba(0,0,0,0.15)',
  position: 'relative',
  [theme.breakpoints.down('md')]: {
    height: 'calc(100vh - 64px)',
    margin: 0,
    borderRadius: 0,
    maxWidth: '100%',
  },
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 4),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: alpha(theme.palette.background.paper, 0.2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  backdropFilter: 'blur(10px)',
  zIndex: 10,
}));

const MessageContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(4),
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  scrollBehavior: 'smooth',
  '&::-webkit-scrollbar': { width: '6px' },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.primary.main, 0.1),
    borderRadius: '10px',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const MessageBubble = styled(motion.div)(({ theme, isSent }) => ({
  alignSelf: isSent ? 'flex-end' : 'flex-start',
  padding: theme.spacing(1.5, 2.5),
  borderRadius: isSent ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
  background: isSent
    ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
    : alpha(theme.palette.background.paper, 0.8),
  color: isSent ? '#fff' : theme.palette.text.primary,
  maxWidth: '65%',
  position: 'relative',
  boxShadow: isSent
    ? '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
    : '0 5px 15px rgba(0,0,0,0.05)',
  border: `1px solid ${alpha(theme.palette.divider, isSent ? 0 : 0.05)}`,
  transition: 'transform 0.2s ease',
  '& img': {
    maxWidth: '100%',
    borderRadius: '12px',
    marginTop: theme.spacing(1),
    display: 'block'
  },
  '&:hover': {
    transform: 'scale(1.01)',
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '85%',
  },
}));

const ChatInputWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5, 4),
  background: alpha(theme.palette.background.paper, 0.4),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const ChatInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '24px',
    background: alpha(theme.palette.background.default, 0.6),
    padding: '4px 12px',
    transition: 'all 0.3s ease',
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.2) },
    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    '&.Mui-focused': {
       boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
  },
}));

const ReplyPreview = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  background: alpha(theme.palette.background.paper, 0.6),
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  borderRadius: '8px',
  marginBottom: theme.spacing(1),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.85rem'
}));

const ReactionBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '4px',
  marginTop: '4px',
  flexWrap: 'wrap'
}));

function Chat({ token }) {
  const { userId, groupId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [typingInfo, setTypingInfo] = useState({ isTyping: false, user: '' });
  const currentUserId = token ? jwtDecode(token).userId : null;
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [openAddMember, setOpenAddMember] = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);

  const playNotification = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (e) {}
  };

  useEffect(() => {
    if (!token) return;
    socket.emit('join', { userId: currentUserId });

    const fetchContent = async () => {
      try {
        const url = userId ? `${API}/api/chat/messages/${userId}` : `${API}/api/chat/group/${groupId}`;
        const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(data);

        // Mark as read
        data.filter(m => m.sender !== currentUserId && !m.read).forEach(m => {
          socket.emit('markRead', { messageId: m._id, readerId: currentUserId });
        });
      } catch (err) { } finally { setLoading(false); }
    };

    fetchContent();

    socket.on('receiveMessage', (msg) => {
      if ((userId && (msg.recipient === userId || msg.sender._id === userId)) || (groupId && msg.group === groupId)) {
        setMessages((prev) => [...prev, msg]);
        if (msg.sender._id !== currentUserId) {
          socket.emit('markRead', { messageId: msg._id, readerId: currentUserId });
          playNotification();
        }
      }
    });

    socket.on('typingStatus', ({ sender, typing, group }) => {
      if (group === groupId || (!group && sender === userId)) {
        setTypingInfo({ isTyping: typing, user: sender });
      }
    });

    socket.on('userStatus', ({ userId: statusUserId, online }) => {
      setUsers(prev => prev.map(u => u._id === statusUserId ? { ...u, online } : u));
    });

    socket.on('messageRead', ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, read: true } : m));
    });

    socket.on('messageUpdated', (updatedMsg) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('typingStatus');
      socket.off('userStatus');
      socket.off('messageRead');
      socket.off('messageUpdated');
    };
  }, [token, userId, groupId, currentUserId]);

  const otherUser = users.find(u => u._id === userId);
  const [groupData, setGroupData] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [uRes, gRes] = await Promise.all([
          axios.get(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
          groupId ? axios.get(`${API}/api/groups/all`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ data: [] })
        ]);
        setUsers(uRes.data);
        if (groupId) {
          const g = gRes.data.find(x => x._id === groupId);
          setGroupData(g);
        }
      } catch (err) {}
    };
    fetchUsers();
  }, [token, groupId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingInfo.isTyping]);

  const displayName = userId ? (otherUser?.username || 'Pilot') : (groupData?.name || 'Central Galaxy');
  const displayStatus = userId ? (otherUser?.online ? 'Active' : 'Offline') : `${groupData?.members?.length || 0} Orbits Synced`;

  const handleTyping = (e) => {
    setText(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { sender: currentUserId, ...(userId ? { recipient: userId } : { group: groupId }) });
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { sender: currentUserId, ...(userId ? { recipient: userId } : { group: groupId }) });
    }, 2000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setAttachment(file);
  };

  const handleSend = async () => {
    if (!text.trim() && !attachment) return;
    
    let fileUrl = null;
    if (attachment) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', attachment);
      try {
        const { data } = await axios.post(`${API}/api/upload`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        fileUrl = data.fileUrl;
      } catch (err) {
        console.error("Upload error", err);
      } finally {
        setUploading(false);
      }
    }

    const msgData = {
      sender: currentUserId,
      content: text,
      fileUrl,
      ...(userId ? { recipient: userId } : { group: groupId }),
      ...(userId ? { recipient: userId } : { group: groupId }),
      timestamp: new Date().toISOString(),
      replyTo: replyTo?._id || null
    };
    
    socket.emit('sendMessage', msgData);
    setAttachment(null);
    setText('');
    setReplyTo(null);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stopTyping', { sender: currentUserId, ...(userId ? { recipient: userId } : { group: groupId }) });
    socket.emit('stopTyping', { sender: currentUserId, ...(userId ? { recipient: userId } : { group: groupId }) });
  };

  const addReaction = (messageId, emoji) => {
    socket.emit('addReaction', { messageId, userId: currentUserId, emoji });
  };

  const handleAddMember = async (memberId) => {
    try {
      await axios.put(`${API}/api/groups/${groupId}/members`, 
        { memberId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenAddMember(false);
      setSearchMember("");
      // Refresh group data
      const { data } = await axios.get(`${API}/api/groups/all`, { headers: { Authorization: `Bearer ${token}` } });
      const g = data.find(x => x._id === groupId);
      setGroupData(g);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ChatWindow component={motion.div} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
      <ChatHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <IconButton onClick={() => navigate('/')} sx={{ border: '1px solid', borderColor: alpha('#000', 0.1), '&:hover': { background: alpha('#000', 0.05) } }}>
            <ArrowLeft size={20} />
          </IconButton>
          <Box sx={{ position: 'relative' }}>
            <Avatar src={otherUser?.profile && `${API}/${otherUser.profile}`} sx={{ width: 48, height: 48, bgcolor: 'primary.main', border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {userId ? displayName?.[0].toUpperCase() : <Users size={24} />}
            </Avatar>
            {userId && otherUser?.online && (
              <Box sx={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, bgcolor: '#10b981', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }} />
            )}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>{displayName}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
               {userId && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: otherUser?.online ? '#10b981' : '#94a3b8' }} />}
               <Typography variant="caption" sx={{ color: (userId && otherUser?.online) ? 'primary.main' : 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {displayStatus}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {!userId && (
            <Tooltip title="Add Member">
              <IconButton onClick={() => setOpenAddMember(true)} sx={{ background: alpha('#000', 0.03), color: 'primary.main' }}>
                <Plus size={22} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Details">
            <IconButton sx={{ background: alpha('#000', 0.03) }}><Info size={22} /></IconButton>
          </Tooltip>
          <IconButton sx={{ background: alpha('#000', 0.03) }}><MoreHorizontal size={22} /></IconButton>
        </Box>
      </ChatHeader>

      <MessageContainer ref={scrollRef}>
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <Box key={i} sx={{ alignSelf: i % 2 === 0 ? 'flex-end' : 'flex-start', mb: 2 }}>
              <Skeleton variant="rounded" width={200} height={60} sx={{ borderRadius: '20px' }} />
            </Box>
          ))
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((m, i) => {
                const isSent = (m.sender?._id || m.sender) === currentUserId;
                return (
                  <MessageBubble
                    key={m._id || i}
                    isSent={isSent}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    onMouseEnter={() => setHoveredMessage(m._id)}
                    onMouseLeave={() => setHoveredMessage(null)}
                  >
                    {!isSent && !userId && (
                      <Typography variant="caption" sx={{ fontWeight: 900, mb: 0.5, display: 'block', color: 'primary.main', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        {users.find(u => u._id === (m.sender?._id || m.sender))?.username || 'Pilot'}
                      </Typography>
                    )}
                    
                    {m.replyTo && (
                        <Box sx={{ 
                            mb: 1, p: 1, borderRadius: '8px', 
                            bgcolor: isSent ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', 
                            borderLeft: '3px solid', borderColor: isSent ? 'white' : 'primary.main',
                            fontSize: '0.75rem', opacity: 0.9, cursor: 'pointer'
                        }}>
                           <Typography variant="caption" fontWeight={700} display="block">
                               Replied to {m.replyTo.sender?.username || 'Unknown'}
                           </Typography>
                           {m.replyTo.content?.substring(0, 50)}
                        </Box>
                    )}

                    {m.content && <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.6 }}>{m.content}</Typography>}
                    {m.fileUrl && <img src={`${API}${m.fileUrl}`} alt="Attached orbit media" loading="lazy" />}
                    
                    {m.reactions?.length > 0 && (
                        <ReactionBar>
                            {Object.entries(m.reactions.reduce((acc, r) => {
                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                return acc;
                            }, {})).map(([emoji, count]) => (
                                <Box key={emoji} onClick={() => addReaction(m._id, emoji)} sx={{ 
                                    bgcolor: isSent ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', 
                                    borderRadius: '12px', px: 0.8, py: 0.2, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 
                                }}>
                                    {emoji} {count > 1 && count}
                                </Box>
                            ))}
                        </ReactionBar>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.8, mt: 0.8 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.6 }}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                      {isSent && <CheckCheck size={14} color={m.read ? "#fff" : "rgba(255,255,255,0.5)"} />}
                    </Box>

                    {hoveredMessage === m._id && (
                        <Box component={motion.div} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} sx={{ 
                            position: 'absolute', top: -35, right: isSent ? 0 : -50, 
                            bgcolor: 'background.paper', boxShadow: 3, borderRadius: '20px', 
                            display: 'flex', gap: 0.5, p: 0.5, zIndex: 10 
                        }}>
                             {['❤️', '👍', '😂', '😮', '🚀'].map(emoji => (
                                 <IconButton key={emoji} size="small" onClick={() => addReaction(m._id, emoji)} sx={{ fontSize: '1rem', p: 0.5 }}>{emoji}</IconButton>
                             ))}
                             <IconButton size="small" onClick={() => setReplyTo(m)} sx={{ p: 0.5 }}><Reply size={14} /></IconButton>
                        </Box>
                    )}
                  </MessageBubble>
                );
              })}
            </AnimatePresence>
            {typingInfo.isTyping && (
              <Box component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', ml: 1 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', background: 'primary.main' }}>
                   {users.find(u => u._id === typingInfo.user)?.username?.[0] || '?'}
                </Avatar>
                <div style={{ display: 'flex', gap: 3 }}>
                   {[0,1,2].map(i => <Box key={i} component={motion.div} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} sx={{ width: 4, height: 4, bgcolor: 'primary.main', borderRadius: '50%' }} />)}
                </div>
              </Box>
            )}
          </>
        )}
      </MessageContainer>

      <ChatInputWrapper>
        <AnimatePresence>
          {attachment && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <Box sx={{ p: 1, position: 'relative', display: 'inline-block' }}>
                <img src={URL.createObjectURL(attachment)} height="60" style={{ borderRadius: '8px' }} alt="Preview" />
                <IconButton onClick={() => setAttachment(null)} size="small" sx={{ position: 'absolute', top: -5, right: -5, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}><Plus size={12} style={{ transform: 'rotate(45deg)' }} /></IconButton>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
            {replyTo && (
                <ReplyPreview initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="primary.main">
                            Replying to {replyTo.sender?.username || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" noWrap sx={{ maxWidth: '300px' }}>
                            {replyTo.content || 'Media attachment'}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setReplyTo(null)}><X size={16} /></IconButton>
                </ReplyPreview>
            )}
        </AnimatePresence>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton sx={{ background: alpha('#000', 0.03) }} component="label">
            <input hidden type="file" accept="image/*" onChange={handleFileSelect} />
            <Image size={22} color="#6366f1" />
          </IconButton>
          <IconButton sx={{ background: alpha('#000', 0.03) }}><Smile size={22} color="#6366f1" /></IconButton>
          <ChatInput 
            fullWidth 
            placeholder={uploading ? "Transmitting media..." : "Type your mission report..."} 
            value={text} 
            onChange={handleTyping}
            disabled={uploading}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <IconButton onClick={handleSend} disabled={(!text.trim() && !attachment) || uploading} sx={{ p: 2, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white' }}>
            {uploading ? <CircularProgress size={24} color="inherit" /> : <Send size={24} />}
          </IconButton>
        </Box>
      </ChatInputWrapper>

      <Dialog 
        open={openAddMember} 
        onClose={() => setOpenAddMember(false)}
        PaperProps={{ sx: { borderRadius: '24px', p: 1, backdropFilter: 'blur(30px)', background: alpha('#fff', 0.85) } }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>Recruit to Frequency</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Search for other pilots to beam into this orbit.</Typography>
          
          <TextField 
            fullWidth 
            placeholder="Search pilot name..."
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
          />

          <Box sx={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {users
              .filter(u => u._id !== currentUserId && !groupData?.members?.includes(u._id) && u.username.toLowerCase().includes(searchMember.toLowerCase()))
              .map(u => (
                <Box 
                  key={u._id} 
                  onClick={() => handleAddMember(u._id)}
                  sx={{ 
                    p: 1.5, 
                    borderRadius: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    cursor: 'pointer',
                    '&:hover': { background: alpha('#6366f1', 0.05) }
                  }}
                >
                  <Avatar src={u.profile && `${API}/${u.profile}`} sx={{ width: 40, height: 40 }} />
                  <Typography fontWeight={700}>{u.username}</Typography>
                  <Box sx={{ flex: 1 }} />
                  <Plus size={18} color="#6366f1" />
                </Box>
              ))}
          </Box>
        </Box>
      </Dialog>
    </ChatWindow>
  );
}

export default Chat;