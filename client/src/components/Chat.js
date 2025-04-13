// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import io from 'socket.io-client';
// import axios from 'axios';
// import { jwtDecode } from 'jwt-decode';

// const socket = io('http://localhost:5000', {
//   transports: ['websocket', 'polling'],
// });

// function Chat({ token }) {
//   const { userId, groupId } = useParams(); // Get userId or groupId from URL
//   const [messages, setMessages] = useState([]);
//   const [message, setMessage] = useState('');
//   const currentUserId = jwtDecode(token).userId;

//   useEffect(() => {
//     socket.emit('join', { userId: currentUserId });

//     // Fetch messages
//     const fetchMessages = async () => {
//       try {
//         const url = userId
//           ? `http://localhost:5000/api/chat/messages/${userId}`
//           : `http://localhost:5000/api/chat/group/${groupId}`;
//         const { data } = await axios.get(url, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setMessages(data);
//       } catch (err) {
//         console.error('Fetch messages error:', err);
//       }
//     };

//     fetchMessages();

//     socket.on('receiveMessage', (msg) => {
//       if (
//         (userId && (msg.recipient === userId || msg.sender._id === userId)) ||
//         (groupId && msg.group === groupId)
//       ) {
//         setMessages((prev) => [...prev, msg]);
//       }
//     });

//     return () => {
//       socket.off('receiveMessage');
//     };
//   }, [token, userId, groupId, currentUserId]);

//   const sendMessage = async () => {
//     if (!message.trim()) return;
//     try {
//       const data = {
//         sender: currentUserId,
//         content: message,
//         ...(userId ? { recipient: userId } : { group: groupId }),
//       };
//       socket.emit('sendMessage', data);
//       setMessage('');
//     } catch (err) {
//       console.error('Send message error:', err);
//     }
//   };

//   const handleFileUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     const formData = new FormData();
//     formData.append('file', file);
//     try {
//       const { data } = await axios.post('http://localhost:5000/api/upload', formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       socket.emit('sendMessage', {
//         sender: currentUserId,
//         ...(userId ? { recipient: userId } : { group: groupId }),
//         fileUrl: data.fileUrl,
//       });
//     } catch (err) {
//       console.error('File upload error:', err);
//     }
//   };

//   return (
//     <div className="chat-content">
//       <h2>{userId ? `Chat with User ${userId}` : `Group ${groupId}`}</h2>
//       <div className="chat-messages">
//         {messages.length === 0 ? (
//           <p className="no-messages">No messages yet</p>
//         ) : (
//           messages.map((msg, idx) => (
//             <div
//               key={idx}
//               className={`message ${msg.sender._id === currentUserId ? 'sent' : 'received'}`}
//             >
//               <strong>{msg.sender.username}:</strong>{' '}
//               {msg.content || (
//                 <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
//                   File
//                 </a>
//               )}
//             </div>
//           ))
//         )}
//       </div>
//       <div className="chat-input">
//         <input
//           type="text"
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           placeholder="Type a message"
//         />
//         <button onClick={sendMessage}>Send</button>
//         <div className="file-upload">
//           <input type="file" onChange={handleFileUpload} />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Chat;



import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
});

function Chat({ token }) {
  const { userId, groupId } = useParams(); // Get userId or groupId from URL
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const currentUserId = jwtDecode(token).userId;

  useEffect(() => {
    socket.emit('join', { userId: currentUserId });

    // Fetch messages
    const fetchMessages = async () => {
      try {
        const url = userId
          ? `http://localhost:5000/api/chat/messages/${userId}`
          : `http://localhost:5000/api/chat/group/${groupId}`;
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(data);
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
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [token, userId, groupId, currentUserId]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      const data = {
        sender: currentUserId,
        content: message,
        ...(userId ? { recipient: userId } : { group: groupId }),
      };
      socket.emit('sendMessage', data);
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
      const { data } = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      socket.emit('sendMessage', {
        sender: currentUserId,
        ...(userId ? { recipient: userId } : { group: groupId }),
        fileUrl: data.fileUrl,
      });
    } catch (err) {
      console.error('File upload error:', err);
    }
  };

  // Delete all messages
  const deleteMessages = async () => {
    console.log(userId);
    console.log(currentUserId);
    try {
      const url = userId
        ? `http://localhost:5000/api/chat/messages/${userId}/${currentUserId}`
        : `http://localhost:5000/api/chat/group/${groupId}/messages`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]);
    } catch (err) {
      console.error('Delete messages error:', err);
    }
  };

  return (
    <div className="chat-content">
      <h2>{userId ? `Chat with User ${userId}` : `Group ${groupId}`}</h2>
      <div className="chat-controls">
        <button onClick={deleteMessages} className="delete-btn">
          Delete All Messages
        </button>
      </div>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet</p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.sender._id === currentUserId ? 'sent' : 'received'}`}
            >
              <strong>{msg.sender.username}:</strong>{' '}
              {msg.content || (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                  File
                </a>
              )}
            </div>
          ))
        )}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
        <div className="file-upload">
          <input type="file" onChange={handleFileUpload} />
        </div>
      </div>
    </div>
  );
}

export default Chat;