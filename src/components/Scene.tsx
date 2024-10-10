import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky } from '@react-three/drei';
import Terrain from './Terrain';
import PlayerCharacter from './Character/PlayerCharacter';
import BaseCharacter from './Character/BaseCharacter';
import * as THREE from 'three';
import {CHUNK_SIZE,
        CHUNK_RES,
        HEIGHT_SCALE,
        NOISE_SCALE,
        RENDER_DISTANCE,
      } from '../constants';


interface Player {
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface SceneProps {
  socket: WebSocket | null;
  playerId: string | null;
  mapSeed: number | null;
  playerName: string | null;
}

const Scene: React.FC<SceneProps> = ({ socket, playerId, mapSeed, playerName }) => {
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 50, 0));
  const [otherPlayers, setOtherPlayers] = useState<{ [key: string]: THREE.Vector3 }>({});

  const handlePositionUpdate = useCallback((newPosition: THREE.Vector3) => {
    setPlayerPosition(newPosition.clone());
  }, []);

  useEffect(() => {
    if (socket) {
      // Listen for updates from the server
      socket.onmessage = (message) => {
        const data = JSON.parse(message.data);

        if (data.type === 'UPDATE_POSITION' && data.id !== playerId) {
          // Update position of other players
          setOtherPlayers((prevPlayers) => ({
            ...prevPlayers,
            [data.id]: new THREE.Vector3(data.position.x, data.position.y, data.position.z),
          }));
        }

        if (data.type === 'PLAYER_DISCONNECT') {
          // Remove player from the scene on disconnect
          setOtherPlayers((prevPlayers) => {
            const updatedPlayers = { ...prevPlayers };
            delete updatedPlayers[data.id];
            return updatedPlayers;
          });
        }

        if (data.type === 'REGISTER') {
          // Initialize the other players on initial connection
          const players: { [key: string]: Player } = data.players; // Type players properly
          const newPlayers: { [key: string]: THREE.Vector3 } = {};
          Object.keys(players).forEach((id) => {
            newPlayers[id] = new THREE.Vector3(
              players[id].position.x,
              players[id].position.y,
              players[id].position.z
            );
          });
          setOtherPlayers(newPlayers);
        }
      };
    }
  }, [socket, playerId]);

  return (
    <Canvas camera={{ position: [0, 50, 50], fov: 75 }}>
      <Sky sunPosition={[100, 100, 20]} />
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={1.5}
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048} 
        shadow-camera-far={50} 
        shadow-camera-left={-10} 
        shadow-camera-right={10} 
        shadow-camera-top={10} 
        shadow-camera-bottom={-10}
      />
      <Physics gravity={[0, -9.81, 0]}>
      {mapSeed && (
          <Terrain 
            chunkSize={CHUNK_SIZE}
            chunkResolution={CHUNK_RES}
            heightScale={HEIGHT_SCALE}
            noiseScale={NOISE_SCALE}
            playerPosition={playerPosition}
            renderDistance={RENDER_DISTANCE}
            mapSeed={mapSeed} // Ensure mapSeed is passed correctly
          />
        )}

        {/* Main player */}
        <PlayerCharacter
          characterRadius = {1}
          onPositionUpdate={handlePositionUpdate} 
          socket={socket}
          playerId={playerId}
          playerName={playerName}
        />
        
        {/* Render other players */}
        {Object.keys(otherPlayers).map((id) => (
          <BaseCharacter
            characterRadius = {1}
            playerName="Babalar"
            playerId={id}
            position={otherPlayers[id].toArray()}
          />
        ))}
      </Physics>
    </Canvas>
  );
};

export default Scene;
