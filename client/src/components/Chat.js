import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
  useTheme,
  useMediaQuery,
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
  X,
  Trash2,
  Paperclip,
  Shield,
  ShieldOff,
  Trash,
} from 'lucide-react';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketProvider';
import { useUI } from '../context/UIProvider';

const API = process.env.REACT_APP_API || "http://localhost:5000";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const socket = useSocket();
  const { showToast } = useUI();

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [typingInfo, setTypingInfo] = useState({ isTyping: false, user: '' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [groupData, setGroupData] = useState(null);
  const [imageDialogUrl, setImageDialogUrl] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const currentUserId = token ? jwtDecode(token).userId : null;
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [openAddMember, setOpenAddMember] = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);

  const playNotification = useCallback(() => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (e) {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const [uRes, gRes, profileRes] = await Promise.all([
        axios.get(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
        groupId ? axios.get(`${API}/api/groups/all`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ data: [] }),
        axios.get(`${API}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(uRes.data);
      if (groupId) {
        const g = gRes.data.find(x => x._id === groupId);
        setGroupData(g);
      }
      if (userId) {
        const amIBlocked = profileRes.data.blockedUsers?.includes(userId);
        setIsBlocked(amIBlocked);
      }
    } catch (err) { console.error("User fetch error:", err); }
  }, [token, groupId, userId]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, fetchUsers]);

  useEffect(() => {
    if (!socket || !token) return;

    socket.emit('join', { userId: currentUserId });

    const onReceiveMessage = (msg) => {
      if ((userId && (msg.recipient === userId || msg.sender._id === userId)) || (groupId && msg.group === groupId)) {
        setMessages((prev) => [...prev, msg]);
        if (msg.sender._id !== currentUserId) {
          socket.emit('markRead', { messageId: msg._id, readerId: currentUserId });
          playNotification();
        }
      }
    };

    const onTypingStatus = ({ sender, typing, group }) => {
      if (group === groupId || (!group && sender === userId)) {
        setTypingInfo({ isTyping: typing, user: sender });
      }
    };

    const onUserStatus = ({ userId: statusUserId, online }) => {
      setUsers(prev => prev.map(u => u._id === statusUserId ? { ...u, online } : u));
    };

    const onMessageRead = ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, read: true } : m));
    };

    const onMessageUpdated = (updatedMsg) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    };

    const onMessageDeleted = ({ messageId, mode, userId: deletingUserId }) => {
      if (mode === 'everyone') {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeletedForEveryone: true, content: "This message was deleted", fileUrl: null } : m));
      } else if (deletingUserId === currentUserId) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    };

    socket.on('receiveMessage', onReceiveMessage);
    socket.on('typingStatus', onTypingStatus);
    socket.on('userStatus', onUserStatus);
    socket.on('messageRead', onMessageRead);
    socket.on('messageUpdated', onMessageUpdated);
    socket.on('messageDeleted', onMessageDeleted);

    const fetchContent = async () => {
      try {
        const url = userId ? `${API}/api/chat/messages/${userId}` : `${API}/api/chat/group/${groupId}`;
        const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(data);
        data.filter(m => m.sender !== currentUserId && !m.read).forEach(m => {
          socket.emit('markRead', { messageId: m._id, readerId: currentUserId });
        });
      } catch (err) {} finally { setLoading(false); }
    };
    fetchContent();

    return () => {
      socket.off('receiveMessage', onReceiveMessage);
      socket.off('typingStatus', onTypingStatus);
      socket.off('userStatus', onUserStatus);
      socket.off('messageRead', onMessageRead);
      socket.off('messageUpdated', onMessageUpdated);
      socket.off('messageDeleted', onMessageDeleted);
    };
  }, [socket, token, userId, groupId, currentUserId, playNotification]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingInfo.isTyping]);

  const otherUser = useMemo(() => users.find(u => u._id === userId), [users, userId]);
  const displayName = useMemo(() => {
    if (userId) return otherUser?.username || 'Pilot';
    if (groupId) return groupData?.name || 'Central Galaxy';
    return 'Orbit Hub';
  }, [userId, otherUser, groupId, groupData]);

  const displayStatus = useMemo(() => {
    if (userId) return otherUser?.online ? 'Active' : 'Offline';
    if (groupId) return `${groupData?.members?.length || 0} Orbits Synced`;
    return 'Initializing...';
  }, [userId, otherUser, groupId, groupData]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket) return;
    socket.emit('typing', { sender: currentUserId, ...(userId ? { recipient: userId } : { group: groupId }) });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { sender: currentUserId, ...(userId ? { recipient: userId } : { group: groupId }) });
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      if (file.type.startsWith('image/')) {
        setAttachmentPreview(URL.createObjectURL(file));
      }
    }
  };

  const addReaction = async (messageId, emoji) => {
    socket?.emit('addReaction', { messageId, userId: currentUserId, emoji });
    setShowEmojiPicker(false);
  };

  const handleDeleteMessage = async (mode) => {
    if (!messageToDelete) return;
    try {
      await axios.post(`${API}/api/chat/message/${messageToDelete._id}/delete`, { mode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (mode === 'everyone') {
        setMessages(prev => prev.map(m => m._id === messageToDelete._id ? { ...m, isDeletedForEveryone: true, content: "This message was deleted", fileUrl: null } : m));
        socket?.emit('messageDeleted', { messageId: messageToDelete._id, mode: 'everyone' });
      } else {
        setMessages(prev => prev.filter(m => m._id !== messageToDelete._id));
      }
      
      setDeleteConfirmOpen(false);
      setMessageToDelete(null);
      showToast(mode === 'everyone' ? "Transmission rescinded for all." : "Transmission hidden from your logs.", "success");
    } catch (err) {
      showToast("Deletion protocol failed.", "error");
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear your view of this chat? This will not affect other pilots' logs.")) return;
    try {
      await axios.post(`${API}/api/chat/clear`, { userId, groupId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([]);
      showToast("Your local transmission history purged.", "success");
      setMenuAnchor(null);
    } catch (err) {
      showToast("Protocol failure: Could not clear chat.", "error");
    }
  };

  const handleBlockUser = async () => {
    try {
      const action = isBlocked ? 'unblock' : 'block';
      await axios.post(`${API}/api/chat/${action}/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsBlocked(!isBlocked);
      showToast(isBlocked ? "Frequency restored." : "Signal blocked.", "success");
      setMenuAnchor(null);
    } catch (err) {
      showToast("Comm link error.", "error");
    }
  };

  const handleAddMember = async (memberId) => {
    try {
      await axios.put(`${API}/api/groups/${groupId}/members`, 
        { memberId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenAddMember(false);
      showToast("New pilot added to orbit.", "success");
      fetchUsers();
    } catch (err) {
      showToast("Failure to add member.", "error");
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !attachment) return;
    setUploading(true);
    try {
      let fileUrl = null;
      if (attachment) {
        const formData = new FormData();
        formData.append('file', attachment);
        const res = await axios.post(`${API}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        fileUrl = res.data.fileUrl;
      }

      const msgData = {
        sender: currentUserId,
        content: text,
        fileUrl,
        replyTo: replyTo?._id,
        ...(userId ? { recipient: userId } : { group: groupId })
      };

      socket.emit('sendMessage', msgData);
      setText('');
      setAttachment(null);
      setAttachmentPreview(null);
      setReplyTo(null);
    } catch (err) {
      console.error("Send error:", err);
      showToast("Transmission failure.", "error");
    } finally {
      setUploading(false);
    }
  };

  const formatDateDivider = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const groupedMessages = useMemo(() => {
    const groups = [];
    messages.forEach(m => {
      const date = new Date(m.timestamp).toDateString();
      if (!groups.length || groups[groups.length - 1].date !== date) {
        groups.push({ date, messages: [] });
      }
      groups[groups.length - 1].messages.push(m);
    });
    return groups;
  }, [messages]);

  const handleMenuOpen = (event) => setMenuAnchor(event.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

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
          <Tooltip title="More Actions">
            <IconButton onClick={handleMenuOpen} sx={{ background: alpha('#000', 0.03) }}>
              <MoreHorizontal size={22} />
            </IconButton>
          </Tooltip>
          
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose} PaperProps={{ sx: { borderRadius: '15px', mt: 1.5, minWidth: 180, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' } }}>
            <MenuItem onClick={handleClearChat} sx={{ py: 1.5 }}>
              <ListItemIcon><Trash size={18} /></ListItemIcon>
              <ListItemText primary="Clear History" primaryTypographyProps={{ fontWeight: 600 }} />
            </MenuItem>
            {userId && (
              <MenuItem onClick={handleBlockUser} sx={{ py: 1.5, color: isBlocked ? 'primary.main' : 'error.main' }}>
                <ListItemIcon>{isBlocked ? <ShieldOff size={18} /> : <Shield size={18} />}</ListItemIcon>
                <ListItemText primary={isBlocked ? "Unblock User" : "Block User"} primaryTypographyProps={{ fontWeight: 600 }} />
              </MenuItem>
            )}
          </Menu>
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
              {groupedMessages.map((group) => (
                <React.Fragment key={group.date}>
                  <Box sx={{ textAlign: 'center', my: 3, position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', bgcolor: alpha(theme.palette.divider, 0.05) }} />
                    <Typography variant="caption" sx={{ position: 'relative', px: 2, bgcolor: 'background.paper', color: 'text.secondary', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {formatDateDivider(group.date)}
                    </Typography>
                  </Box>
                  {group.messages.map((m) => {
                    const isSent = (m.sender?._id || m.sender) === currentUserId;
                    return (
                      <MessageBubble
                        key={m._id}
                        isSent={isSent}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        onMouseEnter={() => !isMobile && setHoveredMessage(m._id)}
                        onMouseLeave={() => setHoveredMessage(null)}
                      >
                        {!isSent && !userId && (
                          <Typography variant="caption" sx={{ fontWeight: 900, mb: 0.5, display: 'block', color: 'primary.main', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            {m.sender?.username || users.find(u => u._id === (m.sender?._id || m.sender))?.username || 'Pilot'}
                          </Typography>
                        )}
                        
                        {m.replyTo && (
                            <Box sx={{ mb: 1, p: 1, borderRadius: '8px', bgcolor: isSent ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', borderLeft: '3px solid', borderColor: isSent ? 'white' : 'primary.main', fontSize: '0.75rem', opacity: 0.9 }}>
                               <Typography variant="caption" fontWeight={900} display="block">↩ {m.replyTo.sender?.username || users.find(u => u._id === (m.replyTo.sender?._id || m.replyTo.sender))?.username || 'Pilot'}</Typography>
                               <Typography variant="caption" noWrap display="block" sx={{ opacity: 0.8 }}>{m.replyTo.content || 'Media Attachment'}</Typography>
                            </Box>
                        )}

                        {m.content && (
                          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.5, wordBreak: 'break-word', opacity: m.isDeletedForEveryone ? 0.6 : 1, fontStyle: m.isDeletedForEveryone ? 'italic' : 'normal' }}>
                            {m.content}
                          </Typography>
                        )}
                        
                        {m.fileUrl && !m.isDeletedForEveryone && (
                          <Box sx={{ mt: 1, cursor: 'pointer' }} onClick={() => setImageDialogUrl(`${API}${m.fileUrl}`)}>
                            <img src={`${API}${m.fileUrl}`} alt="Attached orbit media" style={{ maxWidth: '100%', borderRadius: '12px', maxHeight: '300px' }} loading="lazy" />
                          </Box>
                        )}
                        
                        {m.reactions?.length > 0 && !m.isDeletedForEveryone && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                {Object.entries(m.reactions.reduce((acc, r) => {
                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                    return acc;
                                }, {})).map(([emoji, count]) => (
                                    <Box key={emoji} onClick={() => addReaction(m._id, emoji)} sx={{ bgcolor: isSent ? 'rgba(255,255,255,0.15)' : alpha(theme.palette.primary.main, 0.08), borderRadius: '10px', px: 1, py: 0.3, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid', borderColor: isSent ? 'rgba(255,255,255,0.2)' : 'transparent' }}>
                                        {emoji} <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.6rem' }}>{count}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.8, mt: 0.8 }}>
                          <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 700 }}>
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                          {isSent && !m.isDeletedForEveryone && <CheckCheck size={14} color={m.read ? "#fff" : "rgba(255,255,255,0.5)"} />}
                        </Box>

                        <AnimatePresence>
                          {(hoveredMessage === m._id || isMobile) && !m.isDeletedForEveryone && (
                            <Box 
                              component={motion.div} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              sx={{ position: 'absolute', top: -40, right: isSent ? 0 : 'auto', left: isSent ? 'auto' : 0, bgcolor: 'background.paper', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', borderRadius: '20px', display: 'flex', gap: 0.2, p: 0.4, zIndex: 20, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}
                            >
                              {['❤️', '👍', '😂', '😮', '🚀'].map(emoji => (
                                <IconButton key={emoji} size="small" onClick={(e) => { e.stopPropagation(); addReaction(m._id, emoji); }} sx={{ fontSize: '0.9rem', p: 0.5 }}>{emoji}</IconButton>
                              ))}
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setReplyTo(m); setHoveredMessage(null); }} sx={{ color: 'text.secondary', p: 0.5 }}><Reply size={16} /></IconButton>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMessageToDelete(m); setDeleteConfirmOpen(true); }} sx={{ color: 'error.main', p: 0.5 }}><Trash2 size={16} /></IconButton>
                            </Box>
                          )}
                        </AnimatePresence>

                        {m.isDeletedForEveryone && (
                          <Box sx={{ mt: 1, p: 1, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Trash size={14} color={theme.palette.text.secondary} />
                            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                              This message was deleted
                            </Typography>
                          </Box>
                        )}
                      </MessageBubble>
                    );
                  })}
                </React.Fragment>
              ))}
            </AnimatePresence>
            {typingInfo.isTyping && (
              <Box component={motion.div} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', ml: 1, mt: 1 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: 'primary.main' }}>
                  {typingInfo.user?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center', bgcolor: alpha('#6366f1', 0.08), px: 1.5, py: 0.8, borderRadius: '15px' }}>
                  {[0, 1, 2].map(i => (
                    <Box key={i} component={motion.div} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} sx={{ width: 4, height: 4, bgcolor: 'primary.main', borderRadius: '50%' }} />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>Signal incoming…</Typography>
              </Box>
            )}
          </>
        )}
      </MessageContainer>

      <ChatInputWrapper>
        <AnimatePresence>
          {attachment && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0 }}>
              <Box sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ position: 'relative' }}>
                  {attachmentPreview ? (
                    <img src={attachmentPreview} height="60" style={{ borderRadius: '10px' }} alt="Preview" />
                  ) : (
                    <Chip label={attachment.name} onDelete={() => setAttachment(null)} size="small" icon={<Paperclip size={14} />} />
                  )}
                  <IconButton onClick={() => setAttachment(null)} size="small" sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', p: 0.3 }}><X size={12} /></IconButton>
                </Box>
              </Box>
            </motion.div>
          )}

          {replyTo && (
            <ReplyPreview initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" fontWeight={900} color="primary.main" display="block">↩ {replyTo.sender?.username}</Typography>
                <Typography variant="caption" noWrap display="block" sx={{ opacity: 0.7 }}>{replyTo.content || 'Media Attachment'}</Typography>
              </Box>
              <IconButton size="small" onClick={() => setReplyTo(null)}><X size={16} /></IconButton>
            </ReplyPreview>
          )}

          {showEmojiPicker && (
            <Box sx={{ p: 1, display: 'flex', gap: 1, flexWrap: 'wrap', bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
              {['❤️', '👍', '😂', '😮', '🚀', '🔥', '✨', '👋'].map(emoji => (
                <IconButton key={emoji} onClick={() => setText(prev => prev + emoji)} sx={{ fontSize: '1.5rem', p: 0.6 }}>{emoji}</IconButton>
              ))}
            </Box>
          )}
        </AnimatePresence>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton sx={{ background: alpha(theme.palette.text.primary, 0.03) }} component="label">
            <input hidden type="file" accept="image/*,video/*" onChange={handleFileSelect} />
            <Image size={isMobile ? 20 : 22} color={theme.palette.primary.main} />
          </IconButton>
          
          <IconButton sx={{ background: showEmojiPicker ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.text.primary, 0.03) }} onClick={() => setShowEmojiPicker(p => !p)}>
            <Smile size={isMobile ? 20 : 22} color={theme.palette.primary.main} />
          </IconButton>

          <ChatInput fullWidth multiline maxRows={4} placeholder={isBlocked ? "Signal Restricted" : (uploading ? "Transmitting…" : "Signal orbit…")} value={text} onChange={handleTyping} onKeyDown={handleKeyDown} disabled={uploading || isBlocked} size="small" />

          <IconButton onClick={handleSend} disabled={(!text.trim() && !attachment) || uploading || isBlocked} sx={{ p: 1.5, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', '&:hover': { boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)' }, '&:disabled': { opacity: 0.5, background: '#94a3b8' } }}>
            {uploading ? <CircularProgress size={20} color="inherit" /> : <Send size={20} />}
          </IconButton>
        </Box>
      </ChatInputWrapper>

      <Dialog open={openAddMember} onClose={() => setOpenAddMember(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={800} gutterBottom>Recruit to Frequency</Typography>
          <TextField fullWidth size="small" placeholder="Search pilot name..." value={searchMember} onChange={(e) => setSearchMember(e.target.value)} sx={{ my: 2 }} />
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {users.filter(u => u._id !== currentUserId && !groupData?.members?.includes(u._id) && u.username.toLowerCase().includes(searchMember.toLowerCase())).map(u => (
              <MenuItem key={u._id} onClick={() => handleAddMember(u._id)} sx={{ borderRadius: '12px', mb: 0.5 }}>
                <Avatar src={u.profile && `${API}/${u.profile}`} sx={{ width: 32, height: 32, mr: 1.5 }} />
                <ListItemText primary={u.username} primaryTypographyProps={{ fontWeight: 600 }} />
                <Plus size={16} />
              </MenuItem>
            ))}
          </Box>
        </Box>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={800} gutterBottom>Delete Transmission?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Choose how you want to rescind this signal from the orbit.</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button fullWidth variant="outlined" color="inherit" onClick={() => handleDeleteMessage('me')} sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700 }}>Delete for Me</Button>
            {messageToDelete && (messageToDelete.sender?._id || messageToDelete.sender) === currentUserId && (
              <Button fullWidth variant="contained" color="error" onClick={() => handleDeleteMessage('everyone')} sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800 }}>Delete for Everyone</Button>
            )}
            <Button fullWidth onClick={() => setDeleteConfirmOpen(false)} sx={{ mt: 1, fontWeight: 600, color: 'text.secondary' }}>Cancel</Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog open={!!imageDialogUrl} onClose={() => setImageDialogUrl(null)} maxWidth="lg" PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}>
        <Box sx={{ position: 'relative' }}>
          <IconButton onClick={() => setImageDialogUrl(null)} sx={{ position: 'absolute', top: -40, right: 0, color: 'white' }}><X size={32} /></IconButton>
          <img src={imageDialogUrl} alt="Enlarged media" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px' }} />
        </Box>
      </Dialog>
    </ChatWindow>
  );
}

export default Chat;