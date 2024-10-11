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
  playerName: string;
  playerSkin: string;
  socket: WebSocket | null;
  playerId: string | null;
  mapSeed: number | null;
  isPlayerSpawned: boolean;
  initialGameState: any;
}

const Scene: React.FC<SceneProps> = ({ socket, playerId, mapSeed, playerName, playerSkin, isPlayerSpawned, initialGameState }) => {
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 50, 0));
  const [otherPlayers, setOtherPlayers] = useState<{
    [key: string]: { position: THREE.Vector3; name: string; score: number; skin: string };
  }>({});
  const [wsClient, setWsClient] = useState<WSClient | null>(null);

  const handlePositionUpdate = useCallback((newPosition: THREE.Vector3) => {
    setPlayerPosition(newPosition.clone());
    const velocity = new THREE.Vector3(0, 0, 0); // Replace with actual velocity if available
    wsClient?.sendPosition(newPosition, velocity);
  }, [wsClient]);

  useEffect(() => {
    if (initialGameState) {
      const initialPlayers: typeof otherPlayers = {};
      Object.entries(initialGameState).forEach(([id, playerData]: [string, any]) => {
        if (id !== playerId) {
          initialPlayers[id] = {
            position: new THREE.Vector3(playerData.position.x, playerData.position.y, playerData.position.z),
            name: playerData.playerName,
            score: playerData.score,
            skin: playerData.skin
          };
        }
      });
      setOtherPlayers(initialPlayers);
    }
  }, [initialGameState, playerId]);

  useEffect(() => {
    if (socket && playerId && !wsClient) {
      const client = new WSClient(socket, playerId);
      setWsClient(client);

      client.handlePositionUpdates((id, position) => {
        setOtherPlayers((prevPlayers) => ({
          ...prevPlayers,
          [id]: {
            ...prevPlayers[id],
            position,
          },
        }));
      });

      client.handlePlayerDisconnects((id) => {
        setOtherPlayers((prevPlayers) => {
          const updatedPlayers = { ...prevPlayers };
          delete updatedPlayers[id];
          return updatedPlayers;
        });
      });

      client.handleGameState((players) => {
        setOtherPlayers(players);
      });

      client.handlePlayerSpawned((id, name, skin, position) => {
        setOtherPlayers((prevPlayers) => ({
          ...prevPlayers,
          [id]: {
            name,
            skin,
            position: new THREE.Vector3(position.x, position.y, position.z),
            score: 0,
          },
        }));
      });

      client.handleScoreUpdates((id, score) => {
        setOtherPlayers((prevPlayers) => ({
          ...prevPlayers,
          [id]: {
            ...prevPlayers[id],
            score,
          },
        }));
      });
    }
  }, [socket, playerId, wsClient]);

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

        {isPlayerSpawned && (
          <PlayerCharacter
            characterRadius={1}
            onPositionUpdate={handlePositionUpdate}
            socket={socket}
            playerId={playerId}
            playerName={playerName}
            skin={playerSkin}
            score={0}
          />
        )}
        
        {Object.entries(otherPlayers).map(([id, player]) => (
          id !== playerId && (
          <BaseCharacter
            key={id}
            characterRadius={1}
            playerName={player.name}
            playerId={id}
            position={player.position.toArray()}
            score={player.score}
            skin={player.skin}
          />
          )
        ))}
      </Physics>
    </Canvas>
  );
};

export default Scene;