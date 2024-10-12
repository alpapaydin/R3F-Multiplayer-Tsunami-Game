// WelcomeScreen.tsx

import React, { useEffect, useState } from 'react';
import { WS_URL } from '../../constants';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onConnected: (socket: WebSocket) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onConnected }) => {
  const [dots, setDots] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const socketRef = React.useRef<WebSocket | null>(null);  // WebSocket ref to persist across renders
  const [isSocketConnected, setIsSocketConnected] = useState(false); // Track connection state

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4); // Cycle between 0-3 dots
    }, 500);

    const connectToServer = () => {
      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        // If the socket is already open or in the process of connecting, return to prevent new connections
        return;
      }

      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;  // Assign new socket to ref

      socket.onopen = () => {
        setIsConnecting(false);
        if (!isSocketConnected) {
          onConnected(socket); // Call onConnected with the socket
          setIsSocketConnected(true); // Mark as connected
        }
      };

      socket.onclose = () => {
        console.log('Connection closed, retrying...');
        setIsConnecting(true);
        setIsSocketConnected(false);  // Reset connection state
        setTimeout(connectToServer, 1000); // Retry after 1 second
      };

      socket.onerror = (err) => {
        console.log('WebSocket error, retrying...', err);
        socket.close();  // Trigger retry on error
      };
    };

    connectToServer();  // Attempt connection on mount

    return () => {
      clearInterval(interval); // Clean up interval
    };
  }, [isSocketConnected, onConnected]);  // Ensure it only re-runs when necessary

  return (
    <div className="welcome-screen">
      <h1>{isConnecting ? `Connecting to server${".".repeat(dots)}` : "Connected!"}</h1>
    </div>
  );
};


export default WelcomeScreen;