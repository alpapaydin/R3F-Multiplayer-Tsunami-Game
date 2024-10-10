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
  const [hasStarted, setHasStarted] = useState(false);
  const [mapSeed, setMapSeed] = useState<number | null>(null); // New state for map seed

  const handleConnected = (socket: WebSocket) => {
    setSocket(socket);
    setConnected(true);

    // Listen for registration message and map seed
    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'REGISTER') {
        setPlayerId(data.id);
        setMapSeed(data.mapSeed); // Store the map seed
      }
    };
  };

  const handlePlay = (name: string, skin: string) => {
    setPlayerName(name);
    setPlayerSkin(skin);
    setHasStarted(true);

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
      }, 1000);
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
            mapSeed={mapSeed} // Pass map seed to MainGame
          />

          {!hasStarted && <UserInputOverlay onPlay={handlePlay} />}
        </>
      )}
    </div>
  );
};

export default App;
