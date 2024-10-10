import React from 'react';
import Scene from './Scene';

interface MainGameProps {
  playerName: string;
  playerSkin: string;
}

const MainGame: React.FC<MainGameProps> = () => {
  return (
    <Scene />
  );
};

export default MainGame;
