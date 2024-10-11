import React, { useState } from 'react';
import './UserInputOverlay.css';

interface UserInputOverlayProps {
  onPlay: (name: string, skin: string) => void;
}

const UserInputOverlay: React.FC<UserInputOverlayProps> = ({ onPlay }) => {
  const [name, setName] = useState("");
  const [skin, setSkin] = useState("default");

  const handlePlay = () => {
    if (name) {
      onPlay(name, skin);
    }
  };

  return (
    <div className="user-input-overlay">
      <h2>Enter your name:</h2>
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Your name"
      />
      <h3>Select a skin:</h3>
      <select value={skin} onChange={(e) => setSkin(e.target.value)}>
        <option value="default">Default</option>
        <option value="rainbow">Rainbow</option>
        <option value="glow">Glow</option>
      </select>
      <button onClick={handlePlay}>PLAY</button>
    </div>
  );
};

export default UserInputOverlay;