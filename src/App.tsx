import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import UserInputOverlay from './components/UserInputOverlay';
import MainGame from './components/MainGame';
import './App.css';

const App: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerSkin, setPlayerSkin] = useState<string | null>(null);
  const [isPlayerSpawned, setIsPlayerSpawned] = useState(false);

  const handleConnected = () => {
    setConnected(true);
  };

  const handlePlay = (name: string, skin: string) => {
    setPlayerName(name);
    setPlayerSkin(skin);

    // Simulate player spawn delay
    setTimeout(() => {
      setIsPlayerSpawned(true);
    }, 1000);
  };

  return (
    <div className="app-container">
      {!connected && <WelcomeScreen onConnected={handleConnected} />}
      {connected && (
        <>
          {/* Only show the game scene after the connection is made */}
          <MainGame playerName={playerName ?? "Player"} playerSkin={playerSkin ?? "default"} />

          {/* Show the overlay until the player is spawned */}
          {!isPlayerSpawned && (
            <UserInputOverlay onPlay={handlePlay} />
          )}
        </>
      )}
    </div>
  );
};

export default App;
