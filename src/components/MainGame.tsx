import React from 'react';
import Scene from './Scene';

interface MainGameProps {
  playerName: string;
  playerSkin: string;
  socket: WebSocket | null;
  playerId: string | null;
  mapSeed: number | null; // Map seed passed from the server
}

const MainGame: React.FC<MainGameProps> = ({ socket, playerId, mapSeed }) => {
  return (
    <Scene 
      socket={socket}
      playerId={playerId}
      mapSeed={mapSeed} // Pass map seed to Scene
    />
  );
};

export default MainGame;
