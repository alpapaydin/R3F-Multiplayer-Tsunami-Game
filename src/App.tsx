import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import UserInputOverlay from './components/UserInputOverlay';
import MainGame from './components/MainGame';
import './App.css';

const App: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerSkin, setPlayerSkin] = useState<string | null>(null);
  const [isPlayerSpawned, setIsPlayerSpawned] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // New state to track if the player pressed play

  const handleConnected = (socket: WebSocket) => {
    setSocket(socket);
    setConnected(true);

    // Listen for registration message
    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'REGISTER') {
        setPlayerId(data.id);
      }
    };
  };

  const handlePlay = (name: string, skin: string) => {
    setPlayerName(name);
    setPlayerSkin(skin);
    setHasStarted(true); // Hide the overlay when "Play" is pressed

    // Notify server about player spawn
    if (socket && playerId) {
      socket.send(JSON.stringify({
        type: 'SPAWN_PLAYER',
        id: playerId,
        name: name,
        skin: skin
      }));

      setTimeout(() => {
        setIsPlayerSpawned(true);
      }, 1000); // Optional spawn delay for UI purposes
    }
  };

  return (
    <div className="app-container">
      {!connected && <WelcomeScreen onConnected={handleConnected} />}
      {connected && (
        <>
          <MainGame 
            playerName={playerName ?? "Player"} 
            playerSkin={playerSkin ?? "default"}
            socket={socket}
            playerId={playerId}
          />

          {/* Show the overlay until "Play" is pressed, then hide it */}
          {!hasStarted && <UserInputOverlay onPlay={handlePlay} />}
        </>
      )}
    </div>
  );
};

export default App;
