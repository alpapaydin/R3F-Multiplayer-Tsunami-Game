import React, { useEffect, useState } from 'react';
import {WS_URL} from '../../constants';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onConnected: (socket: WebSocket) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onConnected }) => {
  const [dots, setDots] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4); // Cycle between 0-3 dots
    }, 500);

    const connectToServer = () => {
      const socket = new WebSocket(WS_URL);
      
      socket.onopen = () => {
        setIsConnecting(false);
        onConnected(socket);
      };

      socket.onclose = () => {
        console.log('Connection failed, retrying...');
        setTimeout(connectToServer, 1000); // Retry after 1 second
      };

      socket.onerror = () => {
        console.log('Connection error, retrying...');
        socket.close(); // Trigger retry logic
      };
    };

    connectToServer();

    return () => {
      clearInterval(interval);
    };
  }, [onConnected]);

  return (
    <div className="welcome-screen">
      <h1>{isConnecting ? `Connecting to server${".".repeat(dots)}` : "Connected!"}</h1>
    </div>
  );
};

export default WelcomeScreen;
