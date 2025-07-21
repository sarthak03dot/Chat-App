import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Divider,
  IconButton,
} from '@mui/material';
import { Send, AttachFile } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const API = process.env.REACT_APP_API;

const socket = io(`${API}`, {
  transports: ['websocket', 'polling'],
});

// Styled components for custom styling
const ChatContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: '800px',
  margin: '0 auto',
  height: '80vh',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const MessagesContainer = styled(Paper)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  backgroundColor: theme.palette.grey[100],
}));

const Message = styled(Box)(({ theme, isSent }) => ({
  maxWidth: '70%',
  margin: theme.spacing(1),
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: isSent ? theme.palette.primary.light : theme.palette.grey[300],
  alignSelf: isSent ? 'flex-end' : 'flex-start',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: theme.shadows[1],
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));

const FileLink = styled('a')(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

function Chat({ token }) {
  const { userId, groupId } = useParams();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const currentUserId = jwtDecode(token).userId;
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit('join', { userId: currentUserId });

    // Fetch messages
    const fetchMessages = async () => {
      try {
        const url = userId
          ? `${API}/api/chat/messages/${userId}`
          : `${API}/api/chat/group/${groupId}`;
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(data.map(msg => ({ ...msg, timestamp: msg.timestamp || new Date().toISOString() })));
      } catch (err) {
        console.error('Fetch messages error:', err);
      }
    };

    fetchMessages();

    socket.on('receiveMessage', (msg) => {
      if (
        (userId && (msg.recipient === userId || msg.sender._id === userId)) ||
        (groupId && msg.group === groupId)
      ) {
        setMessages((prev) => [...prev, { ...msg, timestamp: msg.timestamp || new Date().toISOString() }]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [token, userId, groupId, currentUserId]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const { data } = await axios.get(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchAllUsers();
  }, [token]);

  const getUserNameById = (id) => {
    const user = users.find((u) => u._id === id);
    return user ? user.username : 'Unknown';
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      const data = {
        sender: currentUserId,
        content: message,
        ...(userId ? { recipient: userId } : { group: groupId }),
        timestamp: new Date().toISOString(),
      };
      socket.emit('sendMessage', data);
      setMessages((prev) => [...prev, data]);
      setMessage('');
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await axios.post(
        `${API}/api/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      const fileMsg = {
        sender: currentUserId,
        ...(userId ? { recipient: userId } : { group: groupId }),
        fileUrl: data.fileUrl,
        timestamp: new Date().toISOString(),
      };
      socket.emit('sendMessage', fileMsg);
      setMessages((prev) => [...prev, fileMsg]);
    } catch (err) {
      console.error('File upload error:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <ChatContainer>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        {userId
          ? `Chat with ${getUserNameById(userId)}`
          : `Group ${groupId}`}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <MessagesContainer>
        {messages.length === 0 ? (
          <Typography color="textSecondary" align="center">
            No messages yet
          </Typography>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg._id || msg.timestamp}
              isSent={msg.sender === currentUserId || msg.sender._id === currentUserId}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ mr: 1 }}>
                  {getUserNameById(msg.sender._id || msg.sender)[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {getUserNameById(msg.sender._id || msg.sender)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>
              {msg.content && (
                <Typography variant="body2">{msg.content}</Typography>
              )}
              {msg.fileUrl && (
                <FileLink
                  href={msg.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View File
                </FileLink>
              )}
            </Message>
          ))
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <InputContainer>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <Button
          variant="contained"
          color="primary"
          onClick={sendMessage}
          endIcon={<Send />}
          disabled={!message.trim()}
        >
          Send
        </Button>
        <IconButton component="label">
          <AttachFile />
          <input
            type="file"
            hidden
            onChange={handleFileUpload}
          />
        </IconButton>
      </InputContainer>
    </ChatContainer>
  );
}

export default Chat;