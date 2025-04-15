import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
const API = process.env.REACT_APP_API;


const socket = io(`${API}`, {
  transports: ['websocket', 'polling'],
});

function Chat({ token }) {
  const { userId, groupId } = useParams(); // Get userId or groupId from URL
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
    <div className="chat-container">
      <h2>
        {userId
          ? `Chat with ${getUserNameById(userId)} (${userId})`
          : `Group ${groupId}`}
      </h2>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id || msg.timestamp}
              className={`message ${msg.sender === currentUserId ? 'sent' : 'received'}`}
            >
              <div className="message-header">
                <span className="message-sender">
                  {getUserNameById(msg.sender._id || msg.sender)}:
                </span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {msg.content && <p className="message-content">{msg.content}</p>}
              {msg.fileUrl && (
                <a
                  href={msg.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link"
                >
                  File
                </a>
              )}
              {msg.sender === currentUserId }
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="message-input"
        />
        <button onClick={sendMessage} className="send-btn">
          Send
        </button>
        <div className="file-upload">
          <input type="file" onChange={handleFileUpload} />
        </div>
      </div>
    </div>
  );
}

export default Chat;