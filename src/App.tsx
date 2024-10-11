import React, { useState, useEffect } from 'react';
import WelcomeScreen from './components/UI/WelcomeScreen';
import UserInputOverlay from './components/UI/UserInputOverlay';
import Scene from './components/Scene';
import './App.css';

const App: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerSkin, setPlayerSkin] = useState<string | null>(null);
  const [isPlayerSpawned, setIsPlayerSpawned] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [mapSeed, setMapSeed] = useState<number | null>(null);

  const handleConnected = (socket: WebSocket) => {
    setSocket(socket);
    setConnected(true);

    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'REGISTER') {
        setPlayerId(data.id);
        setMapSeed(data.mapSeed);
      }
    };
  };

  const handlePlay = (name: string, skin: string) => {
    setPlayerName(name);
    setPlayerSkin(skin);
    setHasStarted(true);

    if (socket && playerId) {
      socket.send(JSON.stringify({
        type: 'PLAYER_SPAWN',
        id: playerId,
        name: name,
        skin: skin
      }));

      setIsPlayerSpawned(true);
    }
  };

  return (
    <div className="app-container">
      {!connected && <WelcomeScreen onConnected={handleConnected} />}
      {connected && (
        <>
          <Scene
            playerName={playerName ?? "Player"} 
            playerSkin={playerSkin ?? "default"}
            socket={socket}
            playerId={playerId}
            mapSeed={mapSeed}
            isPlayerSpawned={isPlayerSpawned}
          />

          {!hasStarted && <UserInputOverlay onPlay={handlePlay} />}
        </>
      )}
    </div>
  );
};

export default App;