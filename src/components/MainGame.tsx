import React from 'react';
import Scene from './Scene';

interface MainGameProps {
  playerName: string;
  playerSkin: string;
  socket: WebSocket | null; // WebSocket connection
  playerId: string | null;  // Player ID assigned by server
}

const MainGame: React.FC<MainGameProps> = ({ socket, playerId }) => {
  return (
    <Scene 
      socket={socket}
      playerId={playerId}
    />
  );
};

export default MainGame;
