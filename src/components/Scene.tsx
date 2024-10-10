import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky } from '@react-three/drei';
import Terrain from './Terrain';
import Character from './Character';
import * as THREE from 'three';

interface SceneProps {
  socket: WebSocket | null; // WebSocket for receiving updates
  playerId: string | null;  // Player ID assigned by the server
}

const Scene: React.FC<SceneProps> = ({ socket, playerId }) => {
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
        <Terrain 
          chunkSize={64}
          chunkResolution={64}
          heightScale={5}
          noiseScale={0.1}
          playerPosition={playerPosition}
          renderDistance={2}
        />
        {/* Main player */}
        <Character 
          onPositionUpdate={handlePositionUpdate} 
          socket={socket}
          playerId={playerId}
        />
        
        {/* Render other players */}
        {Object.keys(otherPlayers).map((id) => (
          <mesh key={id} position={otherPlayers[id].toArray()}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="red" />
          </mesh>
        ))}
      </Physics>
    </Canvas>
  );
};

export default Scene;
