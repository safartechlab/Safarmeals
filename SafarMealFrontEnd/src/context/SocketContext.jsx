import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Establish connection to port 5000 (Express API Server)
    const newSocket = io('http://localhost:5000', {
      autoConnect: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket Connected to Server:', newSocket.id);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle joining relevant rooms based on user role when authenticated
  useEffect(() => {
    if (socket && isAuthenticated && user) {
      // 1. Join user-specific room
      socket.emit('join_room', `user_${user.id}`);

      // 2. If shopowner, fetch profile and join shop-specific room
      if (user.role === 'shopowner') {
        // Query server to get actual Shop associated (will be handled by caller, or join generic shop_ room)
        // For simplicity, we can fetch shopowner shop details, or just join a room named after their owner ID
        socket.emit('join_room', `owner_${user.id}`);
      }
    }
  }, [socket, isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
