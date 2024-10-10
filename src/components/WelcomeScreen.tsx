import React, { useEffect, useState } from 'react';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onConnected: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onConnected }) => {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4); // Cycle between 0-3 dots
    }, 500);

    // Simulate a connection after 3 seconds
    setTimeout(() => {
      onConnected();
    }, 3000);

    return () => clearInterval(interval);
  }, [onConnected]);

  return (
    <div className="welcome-screen">
      <h1>Connecting to server{".".repeat(dots)}</h1>
    </div>
  );
};

export default WelcomeScreen;
