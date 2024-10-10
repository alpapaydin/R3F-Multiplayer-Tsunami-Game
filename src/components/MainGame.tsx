import React from 'react';
import Scene from './Scene';

interface MainGameProps {
  playerName: string;
  playerSkin: string;
  socket: WebSocket | null;
  playerId: string | null;
  mapSeed: number | null;
}

const MainGame: React.FC<MainGameProps> = ({ socket, playerId, mapSeed , playerName}) => {
  return (
    <Scene
      playerName={playerName}
      socket={socket}
      playerId={playerId}
      mapSeed={mapSeed}
    />
  );
};

export default MainGame;
