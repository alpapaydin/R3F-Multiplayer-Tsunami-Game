import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky } from '@react-three/drei';
import Terrain from './Terrain';
import PlayerCharacter from './Character/PlayerCharacter';
import BaseCharacter from './Character/BaseCharacter';
import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_RES, HEIGHT_SCALE, NOISE_SCALE, RENDER_DISTANCE } from '../constants';
import WSClient from '../network/WSClient';

interface SceneProps {
  socket: WebSocket | null;
  playerId: string | null;
  mapSeed: number | null;
  playerName: string | null;
}

const Scene: React.FC<SceneProps> = ({ socket, playerId, mapSeed, playerName }) => {
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 50, 0));
  const [otherPlayers, setOtherPlayers] = useState<{
    [key: string]: { position: THREE.Vector3; name: string; score: number };
  }>({});
  const [wsClient, setWsClient] = useState<WSClient | null>(null);

  const handlePositionUpdate = useCallback((newPosition: THREE.Vector3) => {
    setPlayerPosition(newPosition.clone());
    const velocity = new THREE.Vector3(0, 0, 0); // Replace with actual velocity if available
    wsClient?.sendPosition(newPosition, velocity);
  }, [wsClient]);

  // Initialize WebSocket Client
  useEffect(() => {
    if (socket && playerId) {
      const client = new WSClient(socket, playerId);
      setWsClient(client);

      // Handle position updates from other players
      client.handlePositionUpdates((id, position) => {
        setOtherPlayers((prevPlayers) => ({
          ...prevPlayers,
          [id]: {
            ...prevPlayers[id],
            position
          }
        }));
      });

      // Handle player disconnections
      client.handlePlayerDisconnects((id) => {
        setOtherPlayers((prevPlayers) => {
          const updatedPlayers = { ...prevPlayers };
          delete updatedPlayers[id];
          return updatedPlayers;
        });
      });

      // Handle player registration (positions, names, scores)
      client.handleRegistration((players) => {
        setOtherPlayers(players);
      });

      // Handle name updates
      client.handleNameUpdates((id, name) => {
        setOtherPlayers((prevPlayers) => ({
          ...prevPlayers,
          [id]: {
            ...prevPlayers[id],
            name
          }
        }));
      });

      // Handle score updates
      client.handleScoreUpdates((id, score) => {
        setOtherPlayers((prevPlayers) => ({
          ...prevPlayers,
          [id]: {
            ...prevPlayers[id],
            score
          }
        }));
      });
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
            mapSeed={mapSeed}
          />
        )}

        {/* Main player */}
        <PlayerCharacter
          characterRadius={1}
          onPositionUpdate={handlePositionUpdate}
          socket={socket}
          playerId={playerId}
          playerName={playerName}
          score={0}
        />
        
        {/* Render other players */}
        {Object.keys(otherPlayers).map((id) => (
        id !== playerId && ( // Skip rendering BaseCharacter if id matches playerId
          <BaseCharacter
            key={id}
            characterRadius={1}
            playerName={otherPlayers[id].name}
            playerId={id}
            position={otherPlayers[id].position.toArray()}
            score={otherPlayers[id].score}
          />
        )))}
      </Physics>
    </Canvas>
  );
};

export default Scene;