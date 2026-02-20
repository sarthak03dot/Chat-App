import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const SocketContext = createContext();

const API = process.env.REACT_APP_API || "http://localhost:5000";

export const SocketProvider = ({ children, token }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      const userId = decoded.userId;

      // Disconnect existing socket if it exists but token/user changed
      // (Simplified: always connect new one if token provided and no socket exists)
      if (!socket) {
        const newSocket = io(API, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
        });

        newSocket.on('connect', () => {
          console.log('Socket connected:', newSocket.id);
          newSocket.emit('join', { userId });
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
        });

        setSocket(newSocket);
      }
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    return () => {
      // If the component unmounts OR token changes, we might want to clean up.
      // However, we want the socket to PERSIST across navigation if the token is same.
      // So we only disconnect when token is nullified (handled in the else above).
    };
  }, [token, socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
